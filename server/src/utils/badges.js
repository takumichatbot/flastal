import prisma from '../config/prisma.js';

// バッジ定義
export const BADGE_DEFS = {
    FIRST_PLEDGE:      { id: 'FIRST_PLEDGE',      label: '初めての支援',       emoji: '🌱', description: '初めて企画を支援しました' },
    PLEDGE_5:          { id: 'PLEDGE_5',           label: '5回支援',           emoji: '🌸', description: '5回以上支援しました' },
    PLEDGE_10:         { id: 'PLEDGE_10',          label: '10回支援',          emoji: '💐', description: '10回以上支援しました' },
    PLEDGE_30:         { id: 'PLEDGE_30',          label: '30回支援',          emoji: '🏆', description: '30回以上支援しました' },
    FIRST_PROJECT:     { id: 'FIRST_PROJECT',      label: '初めての企画',       emoji: '✨', description: '初めて企画を作成しました' },
    PROJECT_SUCCESS:   { id: 'PROJECT_SUCCESS',    label: '企画達成',           emoji: '🎊', description: '企画を目標達成させました' },
    PROJECT_3:         { id: 'PROJECT_3',          label: '3企画達成',         emoji: '🌟', description: '3つ以上の企画を達成しました' },
    TOTAL_10K:         { id: 'TOTAL_10K',          label: '1万pt支援',         emoji: '💎', description: '累計1万pt以上支援しました' },
    TOTAL_100K:        { id: 'TOTAL_100K',         label: '10万pt支援',        emoji: '👑', description: '累計10万pt以上支援しました' },
    EARLY_BIRD:        { id: 'EARLY_BIRD',         label: 'アーリーバード',     emoji: '🐦', description: '企画公開後1時間以内に支援しました' },
    FOLLOWER_10:       { id: 'FOLLOWER_10',        label: '10フォロワー',       emoji: '📣', description: '10人にフォローされています' },
};

/**
 * ユーザーの実績を評価してバッジを付与する。
 * createPledge・createProject・projectSuccess 等の直後に呼ぶ。
 */
export async function evaluateAndAwardBadges(userId) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                badgeIds: true,
                totalPledgedAmount: true,
                _count: {
                    select: {
                        pledges: true,
                        createdProjects: true,
                        followers: true,
                    },
                },
            },
        });
        if (!user) return;

        const successCount = await prisma.project.count({
            where: { plannerId: userId, status: { in: ['SUCCESSFUL', 'COMPLETED'] } },
        });

        const current = new Set(user.badgeIds || []);
        const earned = new Set(current);

        const pledgeCount = user._count.pledges;
        const totalPt = user.totalPledgedAmount || 0;
        const projectCount = user._count.createdProjects;
        const followerCount = user._count.followers;

        if (pledgeCount >= 1)  earned.add('FIRST_PLEDGE');
        if (pledgeCount >= 5)  earned.add('PLEDGE_5');
        if (pledgeCount >= 10) earned.add('PLEDGE_10');
        if (pledgeCount >= 30) earned.add('PLEDGE_30');
        if (totalPt >= 10000)  earned.add('TOTAL_10K');
        if (totalPt >= 100000) earned.add('TOTAL_100K');
        if (projectCount >= 1) earned.add('FIRST_PROJECT');
        if (successCount >= 1) earned.add('PROJECT_SUCCESS');
        if (successCount >= 3) earned.add('PROJECT_3');
        if (followerCount >= 10) earned.add('FOLLOWER_10');

        const newBadges = [...earned].filter(b => !current.has(b));
        if (newBadges.length === 0) return;

        await prisma.user.update({
            where: { id: userId },
            data: { badgeIds: [...earned] },
        });

        // 新規獲得バッジを通知
        const { createNotification } = await import('./notification.js');
        for (const badgeId of newBadges) {
            const def = BADGE_DEFS[badgeId];
            if (def) {
                await createNotification(
                    userId, 'PROJECT_STATUS_UPDATE',
                    `${def.emoji} バッジ「${def.label}」を獲得しました！${def.description}`,
                    null, '/mypage'
                );
            }
        }
    } catch (err) {
        console.error('[Badges]', err.message);
    }
}
