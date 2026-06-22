import prisma from '../config/prisma.js';

export const getProjectPhotos = async (req, res) => {
    const { projectId } = req.params;
    const photos = await prisma.completionPhoto.findMany({
        where: { projectId },
        include: { uploader: { select: { handleName: true, iconUrl: true } } },
        orderBy: { createdAt: 'desc' },
    });
    res.json(photos);
};

export const postPhoto = async (req, res) => {
    const { projectId } = req.params;
    const { imageUrl, caption } = req.body;
    const userId = req.user.id;

    if (!imageUrl) return res.status(400).json({ message: '画像URLが必要です' });

    // 支援者またはプランナーのみ投稿可
    const [project, pledge] = await Promise.all([
        prisma.project.findUnique({ where: { id: projectId }, select: { plannerId: true, status: true } }),
        prisma.pledge.findFirst({ where: { projectId, userId } }),
    ]);
    if (!project) return res.status(404).json({ message: '企画が見つかりません' });
    const isPlanner = project.plannerId === userId;
    if (!isPlanner && !pledge) return res.status(403).json({ message: '支援者またはプランナーのみ投稿できます' });

    const photo = await prisma.completionPhoto.create({
        data: { projectId, uploaderId: userId, imageUrl, caption },
        include: { uploader: { select: { handleName: true, iconUrl: true } } },
    });
    res.status(201).json(photo);
};

export const deletePhoto = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const photo = await prisma.completionPhoto.findUnique({ where: { id } });
    if (!photo) return res.status(404).json({ message: '写真が見つかりません' });
    if (photo.uploaderId !== userId && req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: '権限がありません' });
    }
    await prisma.completionPhoto.delete({ where: { id } });
    res.json({ success: true });
};

export const getGalleryFeed = async (req, res) => {
    const { limit = 20, offset = 0 } = req.query;
    const photos = await prisma.completionPhoto.findMany({
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset),
        include: {
            uploader: { select: { handleName: true, iconUrl: true } },
            project: { select: { id: true, title: true } },
        },
    });
    res.json(photos);
};
