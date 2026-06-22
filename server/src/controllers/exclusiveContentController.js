import prisma from '../config/prisma.js';

const isBacker = async (projectId, userId) => {
    if (!userId) return false;
    const pledge = await prisma.pledge.findFirst({ where: { projectId, userId } });
    return !!pledge;
};

const isAuthorized = async (projectId, userId) => {
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { plannerId: true, members: { select: { userId: true } } },
    });
    if (!project) return false;
    return project.plannerId === userId || project.members.some(m => m.userId === userId);
};

export const getExclusiveContents = async (req, res) => {
    const { projectId } = req.params;
    const userId = req.user?.id;
    try {
        const [authorized, backerStatus] = await Promise.all([
            isAuthorized(projectId, userId),
            isBacker(projectId, userId),
        ]);
        if (!authorized && !backerStatus) {
            return res.status(403).json({ message: 'このコンテンツは支援者限定です' });
        }
        const contents = await prisma.exclusiveContent.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' },
        });
        res.json(contents);
    } catch {
        res.status(500).json({ message: '取得に失敗しました' });
    }
};

export const createExclusiveContent = async (req, res) => {
    const { projectId } = req.params;
    const { title, body, fileUrls = [], contentType = 'TEXT' } = req.body;
    const userId = req.user.id;

    if (!title?.trim()) return res.status(400).json({ message: 'タイトルは必須です' });
    if (!(await isAuthorized(projectId, userId))) {
        return res.status(403).json({ message: '権限がありません' });
    }
    try {
        const content = await prisma.exclusiveContent.create({
            data: { projectId, title, body, fileUrls, contentType },
        });
        res.status(201).json(content);
    } catch {
        res.status(500).json({ message: '作成に失敗しました' });
    }
};

export const deleteExclusiveContent = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    try {
        const content = await prisma.exclusiveContent.findUnique({
            where: { id },
            include: { project: { select: { plannerId: true } } },
        });
        if (!content) return res.status(404).json({ message: '見つかりません' });
        if (content.project.plannerId !== userId && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: '権限がありません' });
        }
        await prisma.exclusiveContent.delete({ where: { id } });
        res.json({ success: true });
    } catch {
        res.status(500).json({ message: '削除に失敗しました' });
    }
};
