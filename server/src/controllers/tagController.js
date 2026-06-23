import prisma from '../config/prisma.js';
import { logger } from '../utils/logger.js';

const DEFAULT_TAGS = [
    { name: 'アイドル・アーティスト', slug: 'idol',        color: '#ec4899' },
    { name: 'VTuber・配信者',          slug: 'vtuber',      color: '#06b6d4' },
    { name: '舞台・ミュージカル',      slug: 'stage',       color: '#8b5cf6' },
    { name: '声優・役者',              slug: 'voice',       color: '#f59e0b' },
    { name: 'アニメ・ゲームイベント',  slug: 'anime',       color: '#10b981' },
    { name: '生誕祭・周年記念',        slug: 'anniversary', color: '#ef4444' },
    { name: 'K-POP',                   slug: 'kpop',        color: '#f97316' },
    { name: 'バンド・ライブ',          slug: 'band',        color: '#6366f1' },
];

export const getAllTags = async (req, res) => {
    try {
        // デフォルトタグが未登録なら一括 upsert
        await prisma.$transaction(
            DEFAULT_TAGS.map(t =>
                prisma.tag.upsert({
                    where: { slug: t.slug },
                    update: {},
                    create: t,
                })
            )
        );
        const tags = await prisma.tag.findMany({ orderBy: { name: 'asc' } });
        res.json(tags);
    } catch (err) {
        res.status(500).json({ message: '取得に失敗しました' });
    }
};

export const getProjectTags = async (req, res) => {
    const { projectId } = req.params;
    try {
        const rows = await prisma.projectTag.findMany({
            where: { projectId },
            include: { tag: true },
        });
        res.json(rows.map(r => r.tag));
    } catch {
        res.status(500).json({ message: '取得に失敗しました' });
    }
};

// GET /api/projects/tags/used - 公開企画で実際に使用されているタグ一覧
export const getUsedTags = async (req, res) => {
    try {
        const rows = await prisma.projectTag.findMany({
            where: {
                project: {
                    status: { not: 'DRAFT' },
                    projectType: 'PUBLIC',
                },
            },
            include: {
                tag: { select: { id: true, name: true, slug: true, color: true } },
            },
            distinct: ['tagId'],
        });
        const tags = rows.map(r => r.tag).sort((a, b) => a.name.localeCompare(b.name, 'ja'));
        res.json(tags);
    } catch (err) {
        logger.error('使用タグ取得エラー', { context: 'tagController', error: err.message });
        res.status(500).json({ message: '取得に失敗しました' });
    }
};

export const setProjectTags = async (req, res) => {
    const { projectId } = req.params;
    const { tagSlugs = [] } = req.body;
    const userId = req.user.id;

    try {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { plannerId: true, members: { select: { userId: true } } },
        });
        if (!project) return res.status(404).json({ message: '企画が見つかりません' });

        const isAuthorized =
            project.plannerId === userId ||
            project.members.some(m => m.userId === userId) ||
            req.user.role === 'ADMIN';
        if (!isAuthorized) return res.status(403).json({ message: '権限がありません' });

        // 既存のタグを削除して再登録
        const tags = await prisma.tag.findMany({ where: { slug: { in: tagSlugs } } });
        await prisma.$transaction([
            prisma.projectTag.deleteMany({ where: { projectId } }),
            ...tags.map(t =>
                prisma.projectTag.create({ data: { projectId, tagId: t.id } })
            ),
        ]);

        res.json(tags);
    } catch (err) {
        res.status(500).json({ message: '更新に失敗しました' });
    }
};
