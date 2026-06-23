import cron from 'node-cron';
import prisma from '../config/prisma.js';
import { logger } from '../utils/logger.js';

// 毎日 4:00 JST（= UTC 19:00）に期限切れリフレッシュトークンを削除
cron.schedule('0 19 * * *', async () => {
  try {
    const result = await prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    logger.info('cleanup_expired_tokens', {
      event: 'cleanup_expired_tokens',
      deletedCount: result.count,
    });
  } catch (error) {
    logger.error('cleanup_expired_tokens_failed', {
      event: 'cleanup_expired_tokens_failed',
      error: error.message,
    });
  }
});
