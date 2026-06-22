import prisma from '../config/prisma.js';
import { createNotification } from '../utils/notification.js';
import { queueEmail } from '../utils/email.js';

// ④ 達成メッセージ一斉送信
export const broadcastSuccessMessage = async (req, res) => {
    const { projectId } = req.params;
    const { subject, message } = req.body;
    const userId = req.user.id;

    if (!subject?.trim() || !message?.trim()) {
        return res.status(400).json({ message: '件名と本文は必須です' });
    }

    try {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                pledges: {
                    where: { userId: { not: null } },
                    select: { userId: true, user: { select: { email: true, handleName: true } } },
                    distinct: ['userId'],
                },
                members: { select: { userId: true } },
            },
        });
        if (!project) return res.status(404).json({ message: '企画が見つかりません' });

        const isAuthorized =
            project.plannerId === userId ||
            project.members.some(m => m.userId === userId);
        if (!isAuthorized) return res.status(403).json({ message: '権限がありません' });

        const supporters = project.pledges.filter(p => p.userId !== userId);
        await Promise.allSettled([
            ...supporters.map(p =>
                createNotification(
                    p.userId,
                    'PROJECT_STATUS_UPDATE',
                    `「${project.title}」プランナーより：${subject}`,
                    projectId,
                    `/projects/${projectId}`
                )
            ),
            ...supporters
                .filter(p => p.user?.email)
                .map(p =>
                    queueEmail(p.user.email, 'PLANNER_MESSAGE', {
                        projectTitle: project.title,
                        subject,
                        message,
                        handleName: p.user.handleName,
                        projectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/projects/${projectId}`,
                    })
                ),
        ]);

        res.json({ sent: supporters.length });
    } catch (err) {
        console.error('broadcastSuccessMessage:', err);
        res.status(500).json({ message: '送信に失敗しました' });
    }
};

// ⑤ チームメンバー一覧
export const getTeamMembers = async (req, res) => {
    const { projectId } = req.params;
    try {
        const members = await prisma.projectMember.findMany({
            where: { projectId },
            include: { user: { select: { id: true, handleName: true, iconUrl: true, email: true } } },
            orderBy: { invitedAt: 'asc' },
        });
        res.json(members);
    } catch {
        res.status(500).json({ message: '取得に失敗しました' });
    }
};

// ⑤ チームメンバー招待（メールアドレスで）
export const inviteTeamMember = async (req, res) => {
    const { projectId } = req.params;
    const { email, role = 'EDITOR' } = req.body;
    const userId = req.user.id;

    try {
        const project = await prisma.project.findUnique({ where: { id: projectId }, select: { plannerId: true, title: true } });
        if (!project) return res.status(404).json({ message: '企画が見つかりません' });
        if (project.plannerId !== userId) return res.status(403).json({ message: 'プランナーのみ招待できます' });

        const targetUser = await prisma.user.findUnique({ where: { email }, select: { id: true, handleName: true, email: true } });
        if (!targetUser) return res.status(404).json({ message: 'ユーザーが見つかりません' });
        if (targetUser.id === userId) return res.status(400).json({ message: '自分自身は招待できません' });

        const existing = await prisma.projectMember.findUnique({
            where: { projectId_userId: { projectId, userId: targetUser.id } },
        });
        if (existing) return res.status(409).json({ message: 'すでにメンバーです' });

        const member = await prisma.projectMember.create({
            data: { projectId, userId: targetUser.id, role },
            include: { user: { select: { id: true, handleName: true, iconUrl: true, email: true } } },
        });

        // 通知
        createNotification(
            targetUser.id, 'PROJECT_STATUS_UPDATE',
            `「${project.title}」のチームメンバーに招待されました`,
            projectId, `/projects/${projectId}`
        ).catch(() => {});

        res.status(201).json(member);
    } catch (err) {
        if (err.code === 'P2002') return res.status(409).json({ message: 'すでにメンバーです' });
        res.status(500).json({ message: '招待に失敗しました' });
    }
};

// ⑤ チームメンバー削除
export const removeTeamMember = async (req, res) => {
    const { projectId, memberId } = req.params;
    const userId = req.user.id;
    try {
        const project = await prisma.project.findUnique({ where: { id: projectId }, select: { plannerId: true } });
        if (project.plannerId !== userId) return res.status(403).json({ message: '権限がありません' });
        await prisma.projectMember.delete({ where: { projectId_userId: { projectId, userId: memberId } } });
        res.json({ success: true });
    } catch {
        res.status(500).json({ message: '削除に失敗しました' });
    }
};
