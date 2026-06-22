import prisma from '../config/prisma.js';
import stripe from '../config/stripe.js';
import { broadcastTicker, checkUserLevelAndBadges, handleSubscriptionWebhook } from './paymentController.js';
import { createNotification } from '../utils/notification.js';
import { queueEmail } from '../utils/email.js';
import { getIO } from '../config/socket.js';
import { evaluateAndAwardBadges } from '../utils/badges.js';
import { pledgeCounter } from '../config/metrics.js';

export const handleStripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        // Express の raw body を使用して検証
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // 決済完了イベントのハンドリング
    if (event.type === 'checkout.session.completed') {
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

                    const newPledge = await tx.pledge.create({
                        data: {
                            projectId: projectId,
                            userId: userId === 'guest' ? null : userId,
                            amount: parseInt(totalAmount),
                            comment: comment,
                            pledgeTierId: tierId === 'none' ? null : tierId,
                            guestName: userId === 'guest' ? guestName : null,
                            guestEmail: userId === 'guest' ? guestEmail : null,
                            isEarlyBacker,
                        }
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

                // ゲストへ完了メール
                if (userId === 'guest' && guestEmail) {
                    queueEmail(guestEmail, 'PLEDGE_COMPLETED', {
                        userName: donorName,
                        projectTitle: result.project.title,
                        amount: parseInt(totalAmount).toLocaleString(),
                        projectId,
                    });
                }

                if (userId && userId !== 'guest') {
                    evaluateAndAwardBadges(userId).catch(() => {});
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
                    broadcastTicker('goal', `🔥『${result.project.title}』が目標金額100%を達成しました！`, `/projects/${projectId}`);
                    queueEmail(result.project.planner.email, 'PROJECT_FUNDED', {
                        plannerName: result.project.planner.handleName || 'さん',
                        projectTitle: result.project.title,
                        collectedAmount: result.project.collectedAmount.toLocaleString(),
                        projectId,
                    });
                }

                console.log(`[Webhook] Pledge processed successfully for project ${projectId}`);
                await prisma.webhookLog.upsert({
                    where: { eventId: event.id },
                    update: {},
                    create: { eventId: event.id, eventType: event.type, status: 'success', metadata: meta },
                }).catch(() => {});
            } catch (err) {
                console.error("[Webhook] Pledge Processing Error:", err);
                await prisma.webhookLog.upsert({
                    where: { eventId: event.id },
                    update: { status: 'error', error: err.message },
                    create: { eventId: event.id, eventType: event.type, status: 'error', metadata: meta, error: err.message },
                }).catch(() => {});
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
                if (chargedUser?.email) {
                    queueEmail(chargedUser.email, 'POINTS_CHARGED', {
                        userName: chargedUser.handleName || 'さん',
                        points: points.toLocaleString(),
                    });
                }
                console.log(`[Webhook] Points charged: ${points} to user ${userId}`);
                await prisma.webhookLog.upsert({
                    where: { eventId: event.id },
                    update: {},
                    create: { eventId: event.id, eventType: event.type, status: 'success', metadata: { userId, points } },
                }).catch(() => {});
            } catch (err) {
                console.error("[Webhook] Point Charge Error:", err);
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
            console.error('Subscription webhook error:', err);
        });
    }

    res.json({ received: true });
};