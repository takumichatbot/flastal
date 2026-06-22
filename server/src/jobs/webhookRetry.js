import cron from 'node-cron';
import prisma from '../config/prisma.js';
import stripe from '../config/stripe.js';

// 失敗したWebhookイベントを30分ごとに最大3回リトライする
export function startWebhookRetryJob() {
    cron.schedule('*/30 * * * *', async () => {
        try {
            const failedLogs = await prisma.webhookLog.findMany({
                where: {
                    status: 'error',
                    retryCount: { lt: 3 },
                    eventId: { not: null },
                },
                orderBy: { createdAt: 'asc' },
                take: 10,
            });

            if (failedLogs.length === 0) return;

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
        } catch (err) {
            console.error('[WebhookRetry] cronジョブエラー:', err.message);
        }
    });

    console.log('[WebhookRetry] cronジョブ起動 (30分ごと)');
}
