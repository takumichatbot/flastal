import prisma from '../config/prisma.js';
import { logger } from '../utils/logger.js';

export const getProjectPhotos = async (req, res) => {
    try {
        const { projectId } = req.params;
        const photos = await prisma.completionPhoto.findMany({
            where: { projectId },
            include: { uploader: { select: { handleName: true, iconUrl: true } } },
            orderBy: { createdAt: 'desc' },
        });
        res.json(photos);
    } catch (err) {
        logger.error('getProjectPhotos error', { context: 'Gallery', error: err.message });
        res.status(500).json({ message: '写真一覧の取得に失敗しました。' });
    }
};

export const postPhoto = async (req, res) => {
    try {
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
    } catch (err) {
        logger.error('postPhoto error', { context: 'Gallery', error: err.message });
        res.status(500).json({ message: '写真の投稿に失敗しました。' });
    }
};

export const deletePhoto = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const photo = await prisma.completionPhoto.findUnique({ where: { id } });
        if (!photo) return res.status(404).json({ message: '写真が見つかりません' });
        if (photo.uploaderId !== userId && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: '権限がありません' });
        }
        await prisma.completionPhoto.delete({ where: { id } });
        res.json({ success: true });
    } catch (err) {
        logger.error('deletePhoto error', { context: 'Gallery', error: err.message });
        res.status(500).json({ message: '写真の削除に失敗しました。' });
    }
};

export const getGalleryFeed = async (req, res) => {
    try {
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const offset = Math.max(0, parseInt(req.query.offset) || 0);
        const photos = await prisma.completionPhoto.findMany({
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
            include: {
                uploader: { select: { handleName: true, iconUrl: true } },
                project: { select: { id: true, title: true } },
            },
        });
        res.json(photos);
    } catch (err) {
        logger.error('getGalleryFeed error', { context: 'Gallery', error: err.message });
        res.status(500).json({ message: 'ギャラリーフィードの取得に失敗しました。' });
    }
};
