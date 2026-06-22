import prisma from '../config/prisma.js';
import { createNotification } from '../utils/notification.js';
import { queueEmail } from '../utils/email.js';

// 企画アップデート一覧取得（誰でも）
export const getUpdates = async (req, res) => {
    const { projectId } = req.params;
    try {
        const updates = await prisma.projectUpdate.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' },
        });
        res.json(updates);
    } catch (err) {
        res.status(500).json({ message: '取得に失敗しました' });
    }
};

// 企画アップデート投稿（プランナー + チームメンバー）
export const createUpdate = async (req, res) => {
    const { projectId } = req.params;
    const { title, body, imageUrls = [] } = req.body;
    const userId = req.user.id;

    if (!title?.trim() || !body?.trim()) {
        return res.status(400).json({ message: 'タイトルと本文は必須です' });
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

        const update = await prisma.projectUpdate.create({
            data: { projectId, title, body, imageUrls },
        });

        // 全支援者に通知・メール（ノンブロッキング）
        const supporters = project.pledges.filter(p => p.userId !== userId);
        Promise.allSettled([
            ...supporters.map(p =>
                createNotification(
                    p.userId,
                    'PROJECT_STATUS_UPDATE',
                    `「${project.title}」から新しいアップデートが届きました：${title}`,
                    projectId,
                    `/projects/${projectId}?tab=updates`
                )
            ),
            ...supporters
                .filter(p => p.user?.email)
                .map(p =>
                    queueEmail(p.user.email, 'PROJECT_UPDATE', {
                        projectTitle: project.title,
                        updateTitle: title,
                        updateBody: body.slice(0, 200),
                        projectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/projects/${projectId}?tab=updates`,
                        handleName: p.user.handleName,
                    })
                ),
        ]);

        res.status(201).json(update);
    } catch (err) {
        console.error('createUpdate:', err);
        res.status(500).json({ message: '投稿に失敗しました' });
    }
};

// 削除（プランナーのみ）
export const deleteUpdate = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    try {
        const update = await prisma.projectUpdate.findUnique({
            where: { id },
            include: { project: { select: { plannerId: true } } },
        });
        if (!update) return res.status(404).json({ message: '見つかりません' });
        if (update.project.plannerId !== userId && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: '権限がありません' });
        }
        await prisma.projectUpdate.delete({ where: { id } });
        res.json({ success: true });
    } catch {
        res.status(500).json({ message: '削除に失敗しました' });
    }
};
