import cron from 'node-cron';
import prisma from '../config/prisma.js';
import { createNotification } from '../utils/notification.js';

// 毎日深夜 0時0分 に実行される設定 ('0 0 * * *')
// ※日本時間(JST)で動かすための設定を入れています
cron.schedule('0 0 * * *', async () => {
  console.log('--- [CRON] 実行: 期限切れ企画の自動キャンセルバッチ ---');
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
      console.log('期限切れの企画はありませんでした。');
      return;
    }

    for (const project of expiredProjects) {
      console.log(`期限切れ企画を発見: ID ${project.id} - ${project.title}`);

      // 目標金額に達していない場合 ＝ 自動キャンセル＆返還
      if (project.collectedAmount < project.targetAmount) {
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

          // 2. 支援者へポイント全額返還 & 通知を送信
          if (project.collectedAmount > 0) {
            for (const pledge of project.pledges) {
              if (pledge.userId && pledge.amount > 0) {
                // ポイント返還
                await tx.user.update({
                  where: { id: pledge.userId },
                  data: { points: { increment: pledge.amount } }
                });

                // 支援者へ通知
                await createNotification(
                  pledge.userId,
                  'PROJECT_STATUS_UPDATE',
                  `企画「${project.title}」は募集期限が終了したため中止となりました。支援額 ${pledge.amount.toLocaleString()}pt は全額返還されました。`,
                  project.id,
                  `/projects/${project.id}`
                );
              }
            }
          }

          // 3. 企画者本人へ通知
          await createNotification(
            project.plannerId,
            'PROJECT_STATUS_UPDATE',
            `企画「${project.title}」は募集期限を過ぎたため、自動的に中止・ポイント返還処理が行われました。`,
            project.id,
            `/projects/${project.id}`
          );
          
          console.log(`自動キャンセル＆返還完了: ID ${project.id}`);
        });
        
      } else {
        // 万が一「目標金額は達成しているのにステータスが更新されていなかった」企画があった場合の安全処理
        await prisma.project.update({
          where: { id: project.id },
          data: { status: 'SUCCESSFUL' }
        });
        console.log(`達成済み企画を SUCCESSFUL に修正: ID ${project.id}`);
      }
    }
    console.log('--- [CRON] 完了: 期限切れ企画の自動キャンセルバッチ ---');
  } catch (error) {
    console.error('[CRON] バッチ処理エラー:', error);
  }
}, {
  scheduled: true,
  timezone: "Asia/Tokyo" // 確実に日本時間の深夜0時に動かす
});