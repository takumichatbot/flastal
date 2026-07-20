import Stripe from 'stripe';
import prisma from '../config/prisma.js';
import { queueEmail } from '../utils/email.js';
import { logger } from '../utils/logger.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function runGroupBuyRefundJob() {
  logger.info('実行: グループ購入締切未達自動返金バッチ', { context: 'CRON' });
  try {
    // deadline が過ぎて OPEN（目標口数未達）のグループ購入を取得
    const expired = await prisma.groupBuy.findMany({
      where: {
        status: 'OPEN',
        deadline: { lt: new Date() },
      },
      include: {
        entries: {
          where: { status: 'PAID' },
          include: {
            user: { select: { email: true, handleName: true } },
          },
        },
        project: { select: { title: true } },
      },
    });

    if (expired.length === 0) {
      logger.info('返金対象のグループ購入はありませんでした', { context: 'GroupBuyRefund' });
      return;
    }

    for (const gb of expired) {
      try {
        // 全 PAID 済みエントリに Stripe 返金
        for (const entry of gb.entries) {
          if (!entry.stripePaymentId) continue;
          try {
            // idempotencyKey にエントリIDを渡すことで、クラッシュ再試行時の二重返金を防ぐ
            await stripe.refunds.create(
              { payment_intent: entry.stripePaymentId },
              { idempotencyKey: entry.id }
            );
            await prisma.groupBuyEntry.update({
              where: { id: entry.id },
              data: { status: 'REFUNDED' },
            });
            // ユーザーへメール通知
            if (entry.user?.email) {
              queueEmail(entry.user.email, 'GROUP_BUY_REFUNDED', {
                userName: entry.user.handleName || 'さん',
                groupBuyTitle: gb.title,
                amount: entry.amount.toLocaleString(),
                projectTitle: gb.project.title,
              });
            }
          } catch (refundErr) {
            logger.error('Refund failed', { context: 'GroupBuyRefund', entryId: entry.id, error: refundErr.message });
          }
        }

        // GroupBuy を CANCELLED に更新
        await prisma.groupBuy.update({
          where: { id: gb.id },
          data: { status: 'CANCELLED' },
        });

        logger.info('GroupBuy cancelled and entries refunded', { context: 'GroupBuyRefund', groupBuyId: gb.id, entryCount: gb.entries.length });
      } catch (err) {
        logger.error('Error processing GroupBuy', { context: 'GroupBuyRefund', groupBuyId: gb.id, error: err.message });
      }
    }

    logger.info('完了: グループ購入締切未達自動返金バッチ', { context: 'CRON' });
  } catch (error) {
    logger.error('グループ購入返金バッチエラー', { context: 'CRON', error: error.message });
  }
}
