import prisma from '../config/prisma.js';
import stripe from '../config/stripe.js';
import { broadcastTicker, checkUserLevelAndBadges, handleSubscriptionWebhook } from './paymentController.js';
import { createNotification, sendPushNotification } from '../utils/notification.js';
import { queueEmail } from '../utils/email.js';
import { getIO } from '../config/socket.js';
import { evaluateAndAwardBadges } from '../utils/badges.js';
import { pledgeCounter } from '../config/metrics.js';
import { fulfillShopOrder, fulfillShopSubscription } from './shopController.js';
import { fulfillSuperchat } from './liveController.js';
import { fulfillGroupBuyEntry } from './groupBuyController.js';
import { detectFraud } from '../utils/fraudDetection.js';
import { logger } from '../utils/logger.js';

export const handleStripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        // Express の raw body を使用して検証
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        logger.error('Stripe webhook signature verification failed', { error: err.message });
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // 決済完了イベントのハンドリング
    if (event.type === 'checkout.session.completed') {
        // ==========================================
        // 重複処理防止: 処理開始時に 'processing' を記録（upsertで競合状態を解消）
        // ==========================================
        let logResult;
        try {
            logResult = await prisma.webhookLog.upsert({
                where: { eventId: event.id },
                update: {},  // 既存レコードは更新しない（status を上書きしない）
                create: {
                    eventId: event.id,
                    eventType: event.type,
                    status: 'processing',
                    metadata: event.data.object.metadata || {},
                },
            });
        } catch (upsertErr) {
            // 一意制約違反（同時リクエスト）→ 重複として安全にスキップ
            logger.info('Concurrent duplicate event skipped', { context: 'Webhook', eventId: event.id });
            return res.json({ received: true });
        }

        // 既に success または processing（60秒以内）なら二重処理をスキップ
        if (logResult.status === 'success') {
            logger.info('Duplicate event ignored (already success)', { context: 'Webhook', eventId: event.id });
            return res.json({ received: true });
        }
        if (logResult.status === 'processing') {
            const ageMs = Date.now() - new Date(logResult.createdAt).getTime();
            if (ageMs < 60000) {
                logger.info(`Event already processing (${Math.round(ageMs / 1000)}s ago)`, { context: 'Webhook', eventId: event.id });
                return res.json({ received: true });
            }
            // 60秒超の processing は古いスタックの可能性があるため再処理を許可
            logger.info('Stale processing event, retrying', { context: 'Webhook', eventId: event.id });
        }

        const session = event.data.object;
        const meta = session.metadata;

        // ==========================================
        // ケースA: 企画への支援 (ハイブリッド決済 or ゲスト)
        // ==========================================
        if (meta && meta.type === 'pledge') {
            const { projectId, userId, totalAmount, pointsUsed, comment, tierId, guestName, guestEmail, refCode } = meta;
            
            try {
                const result = await prisma.$transaction(async (tx) => {
                    // 1. ログインユーザーの場合、使用したポイントを引き落とす
                    if (userId !== 'guest' && parseInt(pointsUsed) > 0) {
                        await tx.user.update({
                            where: { id: userId },
                            data: {
                                points: { decrement: parseInt(pointsUsed) },
                                totalPledgedAmount: { increment: parseInt(totalAmount) }
                            }
                        });
                        await tx.pointTransaction.create({
                            data: {
                                userId,
                                amount: -parseInt(pointsUsed),
                                type: 'PLEDGE_USED',
                                note: `プロジェクト支援: ${projectId}`,
                                projectId,
                            },
                        });
                        await checkUserLevelAndBadges(tx, userId);
                    } else if (userId !== 'guest') {
                        // ポイント未使用でも、支援総額の加算とバッジチェックは行う
                        await tx.user.update({
                            where: { id: userId },
                            data: { totalPledgedAmount: { increment: parseInt(totalAmount) } }
                        });
                        await checkUserLevelAndBadges(tx, userId);
                    }

                    // 2. 支援レコード (Pledge) の作成
                    const backerCountBefore = await tx.pledge.count({ where: { projectId } });
                    const isEarlyBacker = backerCountBefore < 10;

                    const newPledge = await tx.pledge.upsert({
                        where: { stripeSessionId: session.id },
                        update: {}, // 既に存在する場合は何もしない（べき等性確保）
                        create: {
                            stripeSessionId: session.id,
                            projectId: projectId,
                            userId: userId === 'guest' ? null : userId,
                            amount: parseInt(totalAmount),
                            comment: comment,
                            pledgeTierId: tierId === 'none' ? null : tierId,
                            guestName: userId === 'guest' ? guestName : null,
                            guestEmail: userId === 'guest' ? guestEmail : null,
                            isEarlyBacker,
                        },
                    });

                    // 3. プロジェクトの集計金額を更新
                    const updatedProject = await tx.project.update({
                        where: { id: projectId },
                        data: { collectedAmount: { increment: parseInt(totalAmount) } },
                        include: { planner: true }
                    });

                    // 4. 目標達成判定（updateManyでWHERE status='FUNDRAISING'を指定し二重更新を防止）
                    if (updatedProject.collectedAmount >= updatedProject.targetAmount) {
                        await tx.project.updateMany({ where: { id: projectId, status: 'FUNDRAISING' }, data: { status: 'SUCCESSFUL' } });
                    }

                    return { newPledge, project: updatedProject };
                });

                // --- 決済完了後の通知処理 (トランザクション外) ---
                const donor = userId === 'guest'
                    ? { handleName: guestName, email: guestEmail }
                    : await prisma.user.findUnique({ where: { id: userId }, select: { handleName: true, email: true } });
                const donorName = donor?.handleName || guestName || 'ゲスト';

                await createNotification(
                    result.project.plannerId,
                    'NEW_PLEDGE',
                    `${donorName}さんから支援がありました！`,
                    projectId,
                    `/projects/${projectId}`
                );

                sendPushNotification(result.project.plannerId, {
                    title: '💐 新しい支援が届きました！',
                    body: `${donorName}さんから${parseInt(totalAmount).toLocaleString()}円の支援がありました`,
                    url: `/projects/${projectId}`,
                }).catch(() => {});

                // プランナーへメール
                queueEmail(result.project.planner.email, 'PLEDGE_RECEIVED', {
                    plannerName: result.project.planner.handleName || 'さん',
                    projectTitle: result.project.title,
                    amount: parseInt(totalAmount).toLocaleString(),
                    projectId,
                });

                // 支援者へ完了メール（ログインユーザーのみ）
                if (userId !== 'guest' && donor?.email) {
                    queueEmail(donor.email, 'PLEDGE_COMPLETED', {
                        userName: donorName,
                        projectTitle: result.project.title,
                        amount: parseInt(totalAmount).toLocaleString(),
                        projectId,
                    });
                }

                // ゲストへ完了メール（アカウント作成CTAつき）
                if (userId === 'guest' && guestEmail) {
                    queueEmail(guestEmail, 'PLEDGE_COMPLETED_GUEST', {
                        userName: donorName,
                        projectTitle: result.project.title,
                        amount: parseInt(totalAmount).toLocaleString(),
                        projectId,
                        registerUrl: `${process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://www.flastal.com'}/register`,
                    });
                }

                if (userId && userId !== 'guest') {
                    evaluateAndAwardBadges(userId).catch(() => {});
                }

                if (userId && userId !== 'guest') {
                    detectFraud(userId, projectId, parseInt(totalAmount)).catch(err => logger.error('FraudDetection Error', { context: 'Webhook', error: err.message }));
                }

                // 紹介コードからアフィリエイトコミッション記録（3%）
                if (refCode) {
                    const COMMISSION_RATE = 0.03;
                    prisma.user.findFirst({ where: { referralCode: refCode } })
                        .then(referrer => {
                            if (!referrer || referrer.id === userId) return;
                            const reward = Math.floor(parseInt(totalAmount) * COMMISSION_RATE);
                            if (reward <= 0) return;
                            return prisma.$transaction([
                                prisma.affiliateConversion.create({
                                    data: { referrerId: referrer.id, pledgeAmount: parseInt(totalAmount), reward },
                                }),
                                prisma.user.update({
                                    where: { id: referrer.id },
                                    data: { points: { increment: reward } },
                                }),
                                prisma.pointTransaction.create({
                                    data: {
                                        userId: referrer.id,
                                        amount: reward,
                                        type: 'REFERRAL_BONUS',
                                        note: `紹介報酬 (支援額: ${parseInt(totalAmount).toLocaleString()}円)`,
                                        projectId,
                                    },
                                }),
                            ]);
                        })
                        .catch(() => {});
                }

                pledgeCounter.labels(event.data.object.payment_method_types?.[0] || 'card').inc();
                broadcastTicker('pledge', `${donorName}さんが支援しました！🎉`, `/projects/${projectId}`);
                try {
                    getIO().to(projectId).emit('pledgeUpdate', {
                        projectId,
                        collectedAmount: result.project.collectedAmount,
                        targetAmount:    result.project.targetAmount,
                        progress: result.project.targetAmount > 0
                            ? Math.round((result.project.collectedAmount / result.project.targetAmount) * 100)
                            : 0,
                        pledgerName: donorName,
                    });
                } catch (_) {}

                if (result.project.collectedAmount >= result.project.targetAmount) {
                    try { getIO().to(projectId).emit('projectGoalReached', { projectId }); } catch (_) {}
                    sendPushNotification(result.project.plannerId, {
                        title: '🎉 目標金額を達成しました！',
                        body: `「${result.project.title}」が${result.project.collectedAmount.toLocaleString()}円を集めました`,
                        url: `/projects/${projectId}`,
                    }).catch(() => {});
                    broadcastTicker('goal', `🔥『${result.project.title}』が目標金額100%を達成しました！`, `/projects/${projectId}`);
                    queueEmail(result.project.planner.email, 'PROJECT_FUNDED', {
                        plannerName: result.project.planner.handleName || 'さん',
                        projectTitle: result.project.title,
                        collectedAmount: result.project.collectedAmount.toLocaleString(),
                        projectId,
                    });
                }

                logger.info('Pledge processed successfully', { context: 'Webhook', projectId });
                await prisma.webhookLog.upsert({
                    where: { eventId: event.id },
                    update: {},
                    create: { eventId: event.id, eventType: event.type, status: 'success', metadata: meta },
                }).catch(() => {});
            } catch (err) {
                logger.error('Pledge Processing Error', { context: 'Webhook', error: err.message });
                await prisma.webhookLog.upsert({
                    where: { eventId: event.id },
                    update: { status: 'error', error: err.message },
                    create: { eventId: event.id, eventType: event.type, status: 'error', metadata: meta, error: err.message },
                }).catch(() => {});
            }
        }

        // ==========================================
        // ==========================================
        // ケースB-0: 花屋向け資材ショップ注文
        // ==========================================
        if (meta && meta.type === 'shop_order') {
            try {
                await fulfillShopOrder(session);
                logger.info('Shop order fulfilled', { context: 'Webhook', sessionId: session.id });
                await prisma.webhookLog.upsert({
                    where: { eventId: event.id },
                    update: {},
                    create: { eventId: event.id, eventType: event.type, status: 'success', metadata: meta },
                }).catch(() => {});
            } catch (err) {
                logger.error('Shop Order Error', { context: 'Webhook', error: err.message });
                await prisma.webhookLog.upsert({
                    where: { eventId: event.id },
                    update: { status: 'error', error: err.message },
                    create: { eventId: event.id, eventType: event.type, status: 'error', metadata: meta, error: err.message },
                }).catch(() => {});
            }
        }

        // ==========================================
        // ケースB-0b: 花屋向け資材ショップ 定期購入
        // ==========================================
        if (meta && meta.type === 'shop_subscription') {
            try {
                await fulfillShopSubscription(session);
                await prisma.webhookLog.upsert({ where: { eventId: event.id }, update: {}, create: { eventId: event.id, eventType: event.type, status: 'success', metadata: meta } }).catch(() => {});
            } catch (err) {
                logger.error('ShopSubscription Error', { context: 'Webhook', error: err.message });
                await prisma.webhookLog.upsert({ where: { eventId: event.id }, update: { status: 'error', error: err.message }, create: { eventId: event.id, eventType: event.type, status: 'error', metadata: meta, error: err.message } }).catch(() => {});
            }
        }

        // ==========================================
        // ケースB-1: スーパーチャット（制作中継）
        // ==========================================
        if (meta && meta.type === 'superchat') {
            try {
                await fulfillSuperchat(session);
                await prisma.webhookLog.upsert({ where: { eventId: event.id }, update: {}, create: { eventId: event.id, eventType: event.type, status: 'success', metadata: meta } }).catch(() => {});
            } catch (err) {
                logger.error('Superchat Error', { context: 'Webhook', error: err.message });
                await prisma.webhookLog.upsert({ where: { eventId: event.id }, update: { status: 'error', error: err.message }, create: { eventId: event.id, eventType: event.type, status: 'error', metadata: meta, error: err.message } }).catch(() => {});
            }
        }


        // ==========================================
        // ケースB-2: グループ購入
        // ==========================================
        if (meta && meta.type === 'group_buy') {
            try {
                await fulfillGroupBuyEntry(session);
                await prisma.webhookLog.upsert({ where: { eventId: event.id }, update: {}, create: { eventId: event.id, eventType: event.type, status: 'success', metadata: meta } }).catch(() => {});
            } catch (err) {
                logger.error('GroupBuy Error', { context: 'Webhook', error: err.message });
                await prisma.webhookLog.upsert({ where: { eventId: event.id }, update: { status: 'error', error: err.message }, create: { eventId: event.id, eventType: event.type, status: 'error', metadata: meta, error: err.message } }).catch(() => {});
            }
        }

        // ==========================================
        // ケースB: 単純なポイントチャージ
        // ==========================================
        if (meta && meta.type === 'point_charge') {
            const userId = session.client_reference_id;
            const points = parseInt(meta.points);

            try {
                const chargedUser = await prisma.user.update({
                    where: { id: userId },
                    data: { points: { increment: points } },
                    select: { email: true, handleName: true },
                });
                await prisma.pointTransaction.create({
                    data: {
                        userId,
                        amount: points,
                        type: 'POINT_CHARGE',
                        note: 'ポイントチャージ',
                    },
                }).catch(err => logger.error('PointTransaction charge record failed', { context: 'Webhook', error: err.message }));
                if (chargedUser?.email) {
                    queueEmail(chargedUser.email, 'POINTS_CHARGED', {
                        userName: chargedUser.handleName || 'さん',
                        points: points.toLocaleString(),
                    });
                }
                logger.info('Points charged', { context: 'Webhook', points, userId });
                await prisma.webhookLog.upsert({
                    where: { eventId: event.id },
                    update: {},
                    create: { eventId: event.id, eventType: event.type, status: 'success', metadata: { userId, points } },
                }).catch(() => {});
            } catch (err) {
                logger.error('Point Charge Error', { context: 'Webhook', error: err.message });
                await prisma.webhookLog.upsert({
                    where: { eventId: event.id },
                    update: { status: 'error', error: err.message },
                    create: { eventId: event.id, eventType: event.type, status: 'error', metadata: meta, error: err.message },
                }).catch(() => {});
            }
        }
    }

    // Subscription ライフサイクルイベント
    const SUB_EVENTS = [
        'customer.subscription.created',
        'customer.subscription.deleted',
        'invoice.payment_failed',
    ];
    if (SUB_EVENTS.includes(event.type)) {
        await handleSubscriptionWebhook(event.data.object, event.type).catch(err => {
            logger.error('Subscription webhook error', { context: 'Webhook', error: err.message });
        });
    }

    res.json({ received: true });
};