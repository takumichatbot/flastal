import prisma from '../config/prisma.js';

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
        console.error('getDiscussions:', err);
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
        console.error('createDiscussion:', err);
        res.status(500).json({ message: 'ディスカッション投稿に失敗しました' });
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
        console.error('deleteDiscussion:', err);
        res.status(500).json({ message: '削除に失敗しました' });
    }
};
