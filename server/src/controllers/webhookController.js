import prisma from '../config/prisma.js';
import stripe from '../config/stripe.js';
import { broadcastTicker, checkUserLevelAndBadges } from './paymentController.js';
import { createNotification } from '../utils/notification.js';

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
            const { projectId, userId, totalAmount, pointsUsed, comment, tierId, guestName, guestEmail } = meta;
            
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
                    const newPledge = await tx.pledge.create({
                        data: {
                            projectId: projectId,
                            userId: userId === 'guest' ? null : userId,
                            amount: parseInt(totalAmount), // 支援としての総額を記録
                            comment: comment,
                            pledgeTierId: tierId === 'none' ? null : tierId,
                            guestName: userId === 'guest' ? guestName : null,
                            guestEmail: userId === 'guest' ? guestEmail : null,
                            // paymentIntentId を保存するカラムがあれば追加（今回は省略）
                        }
                    });

                    // 3. プロジェクトの集計金額を更新
                    const updatedProject = await tx.project.update({
                        where: { id: projectId },
                        data: { collectedAmount: { increment: parseInt(totalAmount) } },
                        include: { planner: true }
                    });

                    // 4. 目標達成判定
                    if (updatedProject.collectedAmount >= updatedProject.targetAmount && updatedProject.status !== 'SUCCESSFUL') {
                        await tx.project.update({ where: { id: projectId }, data: { status: 'SUCCESSFUL' } });
                    }

                    return { newPledge, project: updatedProject };
                });

                // --- 決済完了後の通知処理 (トランザクション外) ---
                const donorName = userId === 'guest' ? guestName : (await prisma.user.findUnique({ where: { id: userId } })).handleName;
                
                await createNotification(
                    result.project.plannerId,
                    'NEW_PLEDGE',
                    `${donorName}さんから支援がありました！`,
                    projectId,
                    `/projects/${projectId}`
                );

                broadcastTicker('pledge', `${donorName}さんが支援しました！🎉`, `/projects/${projectId}`);

                if (result.project.collectedAmount >= result.project.targetAmount && result.project.status === 'SUCCESSFUL') {
                    broadcastTicker('goal', `🔥『${result.project.title}』が目標金額100%を達成しました！`, `/projects/${projectId}`);
                }

                console.log(`[Webhook] Pledge processed successfully for project ${projectId}`);
            } catch (err) {
                console.error("[Webhook] Pledge Processing Error:", err);
            }
        }

        // ==========================================
        // ケースB: 単純なポイントチャージ
        // ==========================================
        if (meta && meta.type === 'point_charge') {
            const userId = session.client_reference_id;
            const points = parseInt(meta.points);

            try {
                await prisma.user.update({
                    where: { id: userId },
                    data: { points: { increment: points } }
                });
                console.log(`[Webhook] Points charged: ${points} to user ${userId}`);
            } catch (err) {
                console.error("[Webhook] Point Charge Error:", err);
            }
        }
    }

    res.json({ received: true });
};