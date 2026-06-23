import prisma from '../config/prisma.js';
import { queueEmail } from '../utils/email.js';
import { logger } from '../utils/logger.js';

const escapeHtml = (str) => String(str || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

export async function runNotificationDigestJob() {
  logger.info('通知ダイジェスト送信開始', { context: 'CRON' });

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24時間前

  // 過去24時間の未読通知を持つユーザーを取得
  const usersWithUnread = await prisma.notification.groupBy({
    by: ['recipientId'],
    where: {
      isRead: false,
      createdAt: { gte: since },
      recipientId: { not: null },
    },
    _count: { id: true },
    having: { id: { _count: { gt: 0 } } },
  });

  for (const { recipientId, _count } of usersWithUnread) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: recipientId },
        select: { email: true, handleName: true, notificationSettings: true },
      });

      if (!user?.email) continue;

      // ユーザーがメール通知を無効にしている場合はスキップ
      const settings = user.notificationSettings || {};
      if (settings.email_digest === false) continue;

      const notifications = await prisma.notification.findMany({
        where: {
          recipientId,
          isRead: false,
          createdAt: { gte: since },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      if (notifications.length === 0) continue;

      const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.flastal.com';
      const notificationList = `
        <ul style="padding:0;margin:0 0 24px 0;list-style:none;">
          ${notifications.map(n => `
            <li style="border-bottom:1px solid #f1f5f9;padding:12px 0;">
              <a href="${APP_URL}${escapeHtml(n.linkUrl || '/')}" style="color:#1e293b;text-decoration:none;font-size:14px;line-height:1.6;">
                ${escapeHtml(n.message || n.type)}
              </a>
            </li>
          `).join('')}
        </ul>
      `;

      queueEmail(user.email, 'NOTIFICATION_DIGEST', {
        userName: escapeHtml(user.handleName || 'さん'),
        count: notifications.length,
        notificationList,
      });
    } catch (err) {
      logger.error(`Error for user ${recipientId}`, { context: 'Digest', recipientId, error: err.message });
    }
  }

  logger.info(`ダイジェスト送信完了: ${usersWithUnread.length}人`, { context: 'CRON', count: usersWithUnread.length });
}
