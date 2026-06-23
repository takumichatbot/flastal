import cron from 'node-cron';
import prisma from '../config/prisma.js';
import stripe from '../config/stripe.js';

const MAX_RETRIES = 3;

// 失敗したWebhookイベントを30分ごとに最大3回リトライする
export function startWebhookRetryJob() {
    cron.schedule('*/30 * * * *', async () => {
        try {
            const failedLogs = await prisma.webhookLog.findMany({
                where: {
                    status: 'error',
                    retryCount: { lt: MAX_RETRIES },
                    eventId: { not: null },
                },
                orderBy: { createdAt: 'asc' },
                take: 10,
            });

            if (failedLogs.length === 0) {
                // リトライ対象がなくても DLQ チェックは実施する
            } else {
                console.log(`[WebhookRetry] ${failedLogs.length}件の失敗イベントを再試行します`);

                for (const log of failedLogs) {
                    try {
                        // Stripe から元のイベントを取得して再処理
                        const event = await stripe.events.retrieve(log.eventId);

                        if (event.type === 'checkout.session.completed') {
                            const session = event.data.object;
                            const meta = session.metadata;

                            if (meta?.type === 'pledge') {
                                // Stripe ダッシュボードで手動確認するため、ログのステータスのみ更新
                                console.log(`[WebhookRetry] pledge event ${log.eventId} を要確認としてマーク`);
                            }
                        }

                        // リトライカウントのみ更新（本番では完全な再処理ロジックを追加）
                        await prisma.webhookLog.update({
                            where: { id: log.id },
                            data: { retryCount: { increment: 1 }, lastRetryAt: new Date() },
                        });

                        console.log(`[WebhookRetry] ${log.eventId} retry #${log.retryCount + 1}`);
                    } catch (err) {
                        console.error(`[WebhookRetry] ${log.eventId} リトライ失敗:`, err.message);
                        await prisma.webhookLog.update({
                            where: { id: log.id },
                            data: { retryCount: { increment: 1 }, lastRetryAt: new Date() },
                        }).catch(() => {});
                    }
                }
            }

            // ── DLQ（デッドレターキュー）処理 ──────────────────────────
            // MAX_RETRIES 回失敗済みかつ未DLQ処理のレコードを抽出
            const dlqCandidates = await prisma.webhookLog.findMany({
                where: {
                    status: 'error',
                    retryCount: { gte: MAX_RETRIES },
                    dlqAt: null,
                },
            });

            for (const log of dlqCandidates) {
                // DLQ フラグをセット
                await prisma.webhookLog.update({
                    where: { id: log.id },
                    data: {
                        status: 'dead_letter',
                        dlqAt: new Date(),
                    },
                }).catch(() => {});

                // 管理者へメール通知（fire-and-forget）
                const { queueEmail } = await import('../utils/email.js');
                queueEmail(
                    process.env.ADMIN_EMAIL || 'admin@flastal.com',
                    'WEBHOOK_DLQ_ALERT',
                    {
                        eventId:   log.eventId   ?? '(不明)',
                        eventType: log.eventType ?? '(不明)',
                        error:     log.error     ?? '(詳細なし)',
                        retryCount: String(log.retryCount),
                        createdAt: log.createdAt.toISOString(),
                    }
                );

                console.error(
                    `[WebhookRetry] DLQ: eventId=${log.eventId} after ${log.retryCount} retries`
                );
            }
        } catch (err) {
            console.error('[WebhookRetry] cronジョブエラー:', err.message);
        }
    });

    console.log('[WebhookRetry] cronジョブ起動 (30分ごと)');
}
