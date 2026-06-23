import prisma from '../config/prisma.js';
import { createNotification } from '../utils/notification.js';
import { logger } from '../utils/logger.js';

export async function runOfferExpiryJob() {
  logger.info('オファー期限切れチェック', { context: 'CRON' });
  try {
    const expiredOffers = await prisma.offer.findMany({
      where: {
        status: 'PENDING',
        expiresAt: { lt: new Date() },
      },
      include: {
        project: { select: { id: true, title: true, plannerId: true } },
        florist: { select: { id: true, shopName: true, platformName: true } },
      },
    });

    if (expiredOffers.length === 0) {
      logger.info('期限切れオファーなし', { context: 'OfferExpiry' });
      return;
    }

    for (const offer of expiredOffers) {
      await prisma.offer.update({
        where: { id: offer.id },
        data: { status: 'EXPIRED' },
      });

      const shopName = offer.florist.platformName || offer.florist.shopName || 'お花屋さん';

      // 企画者に通知
      await createNotification(
        offer.project.plannerId,
        'OFFER_EXPIRED',
        `「${shopName}」へのオファーが期限切れになりました。別のお花屋さんを探しましょう。`,
        offer.project.id,
        `/florists`
      );

      logger.info('Offer expired', { context: 'OfferExpiry', offerId: offer.id, florist: shopName });
    }

    logger.info(`${expiredOffers.length}件のオファーを期限切れ処理しました`, { context: 'OfferExpiry', count: expiredOffers.length });
  } catch (err) {
    logger.error('Error', { context: 'OfferExpiry', error: err.message });
  }
}
