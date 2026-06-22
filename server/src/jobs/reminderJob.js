import prisma from '../config/prisma.js';
import { queueEmail } from '../utils/email.js';

const REMINDER_HOURS = 48;

export async function runDeadlineReminders() {
    const now = new Date();
    const cutoff = new Date(now.getTime() + REMINDER_HOURS * 60 * 60 * 1000);
    const floor = new Date(now.getTime() + (REMINDER_HOURS - 1) * 60 * 60 * 1000);

    // 48時間以内に締め切りを迎える未達成のFUNDRAISING企画
    const projects = await prisma.project.findMany({
        where: {
            status: 'FUNDRAISING',
            deadline: { gte: floor, lte: cutoff },
        },
        include: {
            pledges: {
                where: { userId: { not: null } },
                include: { user: { select: { email: true, handleName: true } } },
                distinct: ['userId'],
            },
            planner: { select: { handleName: true } },
        },
    });

    for (const project of projects) {
        const progress = project.targetAmount > 0
            ? Math.round((project.collectedAmount / project.targetAmount) * 100)
            : 0;
        const remaining = Math.max(0, project.targetAmount - project.collectedAmount);
        const hoursLeft = Math.round((new Date(project.deadline) - now) / 3600000);

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
        }
    }

    console.log(`[reminderJob] ${projects.length}件の企画にリマインダー送信`);
}

export function startReminderJob() {
    // 1時間ごとに実行
    const INTERVAL_MS = 60 * 60 * 1000;
    runDeadlineReminders().catch(console.error);
    setInterval(() => runDeadlineReminders().catch(console.error), INTERVAL_MS);
}
