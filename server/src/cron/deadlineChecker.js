import cron from 'node-cron';
import prisma from '../config/prisma.js';
import { createNotification } from '../utils/notification.js';
import { queueEmail } from '../utils/email.js';
import { logger } from '../utils/logger.js';

// 毎日深夜 0時0分 に実行される設定 ('0 0 * * *')
// ※日本時間(JST)で動かすための設定を入れています
cron.schedule('0 0 * * *', async () => {
  logger.info('実行: 期限切れ企画の自動キャンセルバッチ', { context: 'CRON' });
  try {
    const now = new Date();
    
    // 「募集中」かつ「締切日(deadline)が現在時刻より過去」の企画を探す
    const expiredProjects = await prisma.project.findMany({
      where: {
        status: 'FUNDRAISING',
        deadline: {
          lt: now
        }
      },
      include: {
        pledges: true
      }
    });

    if (expiredProjects.length === 0) {
      logger.info('期限切れの企画はありませんでした', { context: 'CRON' });
      return;
    }

    for (const project of expiredProjects) {
      logger.info('期限切れ企画を発見', { context: 'CRON', projectId: project.id, title: project.title });

      // 目標金額に達していない場合 ＝ 自動キャンセル＆返還
      if (project.collectedAmount < project.targetAmount) {
        // トランザクション内では通知（DB書き込み + push）を送らず、送信対象だけ収集しておく。
        // 支援者が多い企画ではループ中の通知送信が 5秒のトランザクションタイムアウトを超え、
        // 通知は送信済みなのに返還がロールバックされる不整合が起きるため。
        const notificationsToSend = [];

        await prisma.$transaction(async (tx) => {

          // 1. 企画のステータスを CANCELED に更新
          await tx.project.update({
            where: { id: project.id },
            data: {
              status: 'CANCELED',
              cancellationDate: now,
              cancellationFee: 0, // 自動キャンセルはペナルティなし
              refundStatus: project.collectedAmount > 0 ? 'FULL' : 'NONE'
            }
          });

          // 2. 支援者へポイント全額返還（通知はコミット後にまとめて送信）
          if (project.collectedAmount > 0) {
            for (const pledge of project.pledges) {
              if (pledge.userId && pledge.amount > 0) {
                // ポイント返還
                await tx.user.update({
                  where: { id: pledge.userId },
                  data: { points: { increment: pledge.amount } }
                });

                // 支援者へ送る通知を収集
                notificationsToSend.push({
                  recipientId: pledge.userId,
                  type: 'PROJECT_STATUS_UPDATE',
                  message: `企画「${project.title}」は募集期限が終了したため中止となりました。支援額 ${pledge.amount.toLocaleString()}pt は全額返還されました。`,
                  projectId: project.id,
                  linkUrl: `/projects/${project.id}`,
                });
              }
            }
          }

          // 3. 企画者本人への通知を収集
          notificationsToSend.push({
            recipientId: project.plannerId,
            type: 'PROJECT_STATUS_UPDATE',
            message: `企画「${project.title}」は募集期限を過ぎたため、自動的に中止・ポイント返還処理が行われました。`,
            projectId: project.id,
            linkUrl: `/projects/${project.id}`,
          });

          logger.info('自動キャンセル＆返還完了', { context: 'CRON', projectId: project.id });
        });

        // トランザクションのコミット後に通知/pushを送信する（返還が確定してから通知）
        for (const n of notificationsToSend) {
          await createNotification(n.recipientId, n.type, n.message, n.projectId, n.linkUrl);
        }

      } else {
        // 万が一「目標金額は達成しているのにステータスが更新されていなかった」企画があった場合の安全処理
        await prisma.project.update({
          where: { id: project.id },
          data: { status: 'SUCCESSFUL' }
        });
        logger.info('達成済み企画を SUCCESSFUL に修正', { context: 'CRON', projectId: project.id });
      }
    }
    logger.info('完了: 期限切れ企画の自動キャンセルバッチ', { context: 'CRON' });
  } catch (error) {
    logger.error('バッチ処理エラー', { context: 'CRON', error: error.message });
  }
}, {
  scheduled: true,
  timezone: "Asia/Tokyo" // 確実に日本時間の深夜0時に動かす
});

// ==========================================
// 毎日午前9時 (JST) に実行: 締切3日前リマインダーメール
// ==========================================
export async function sendDeadlineReminderEmails() {
  logger.info('実行: 締切3日前リマインダーメールバッチ', { context: 'CRON' });
  try {
    const now = new Date();
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    // 締切が現在〜3日後の FUNDRAISING 企画を取得
    const projects = await prisma.project.findMany({
      where: {
        status: 'FUNDRAISING',
        deadline: {
          gte: now,
          lte: threeDaysFromNow,
        },
      },
      include: {
        pledges: {
          where: { userId: { not: null } },
          include: {
            user: { select: { id: true, email: true, handleName: true } },
          },
          distinct: ['userId'],
        },
      },
    });

    // 目標未達成の企画のみ対象
    const failingProjects = projects.filter(
      (p) => p.collectedAmount < p.targetAmount
    );

    if (failingProjects.length === 0) {
      logger.info('対象企画なし', { context: 'リマインダー' });
      return;
    }

    for (const project of failingProjects) {
      const progress =
        project.targetAmount > 0
          ? Math.round((project.collectedAmount / project.targetAmount) * 100)
          : 0;
      const remaining = Math.max(0, project.targetAmount - project.collectedAmount);
      const hoursLeft = Math.round(
        (new Date(project.deadline) - now) / 3600000
      );

      for (const pledge of project.pledges) {
        if (!pledge.user?.email) continue;
        queueEmail(pledge.user.email, 'DEADLINE_REMINDER', {
          userName: pledge.user.handleName || 'さん',
          projectTitle: project.title,
          progress,
          remaining: remaining.toLocaleString(),
          hoursLeft,
          projectId: project.id,
        });
        logger.info('リマインダー送信', { context: 'リマインダー', email: pledge.user.email, projectTitle: project.title });
      }
    }

    logger.info(`完了: リマインダー対象 ${failingProjects.length}件`, { context: 'CRON', count: failingProjects.length });
  } catch (error) {
    logger.error('リマインダーメールバッチエラー', { context: 'CRON', error: error.message });
  }
}

cron.schedule('0 9 * * *', () => sendDeadlineReminderEmails(), {
  scheduled: true,
  timezone: 'Asia/Tokyo', // 日本時間の午前9時に実行
});