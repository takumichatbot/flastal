import prisma from '../config/prisma.js';
import { logger } from '../utils/logger.js';

export const getDiscussions = async (req, res) => {
    const { projectId } = req.params;
    try {
        const threads = await prisma.discussion.findMany({
            where: { projectId, parentId: null },
            include: {
                author: { select: { id: true, handleName: true, iconUrl: true } },
                replies: {
                    include: {
                        author: { select: { id: true, handleName: true, iconUrl: true } },
                    },
                    orderBy: { createdAt: 'asc' },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(threads);
    } catch (err) {
        logger.error('getDiscussions', { context: 'discussionController', error: err.message });
        res.status(500).json({ message: 'ディスカッション取得に失敗しました' });
    }
};

export const createDiscussion = async (req, res) => {
    const { projectId } = req.params;
    const { body, parentId } = req.body;
    if (!body?.trim()) return res.status(400).json({ message: '本文を入力してください' });

    try {
        const post = await prisma.discussion.create({
            data: {
                projectId,
                authorId: req.user.id,
                body: body.trim(),
                parentId: parentId || null,
            },
            include: {
                author: { select: { id: true, handleName: true, iconUrl: true } },
            },
        });
        res.status(201).json(post);
    } catch (err) {
        logger.error('createDiscussion', { context: 'discussionController', error: err.message });
        res.status(500).json({ message: 'ディスカッション投稿に失敗しました' });
    }
};

export const getDiscussionReplies = async (req, res) => {
    const { discussionId } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    try {
        // 親コメントの存在確認
        const parent = await prisma.discussion.findUnique({
            where: { id: discussionId },
            select: { id: true, projectId: true },
        });
        if (!parent) return res.status(404).json({ message: 'コメントが見つかりません。' });

        const [replies, total] = await prisma.$transaction([
            prisma.discussion.findMany({
                where: { parentId: discussionId },
                include: {
                    author: { select: { id: true, handleName: true, iconUrl: true } },
                },
                orderBy: { createdAt: 'asc' },
                skip,
                take: limit,
            }),
            prisma.discussion.count({ where: { parentId: discussionId } }),
        ]);

        res.json({
            replies,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (err) {
        logger.error('getDiscussionReplies error', { context: 'Discussion', error: err.message });
        res.status(500).json({ message: 'レプライの取得に失敗しました。' });
    }
};

export const deleteDiscussion = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    try {
        const post = await prisma.discussion.findUnique({ where: { id } });
        if (!post) return res.status(404).json({ message: '見つかりません' });
        if (post.authorId !== userId && userRole !== 'ADMIN') {
            return res.status(403).json({ message: '権限がありません' });
        }
        await prisma.discussion.delete({ where: { id } });
        res.json({ success: true });
    } catch (err) {
        logger.error('deleteDiscussion', { context: 'discussionController', error: err.message });
        res.status(500).json({ message: '削除に失敗しました' });
    }
};
