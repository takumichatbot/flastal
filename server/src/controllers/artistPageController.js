import prisma from '../config/prisma.js';

export const getArtistPage = async (req, res) => {
    const { slug } = req.params;
    try {
        const page = await prisma.artistPage.findUnique({ where: { slug } });
        if (!page) return res.status(404).json({ message: 'アーティストページが見つかりません' });
        res.json(page);
    } catch {
        res.status(500).json({ message: '取得に失敗しました' });
    }
};

export const listArtistPages = async (req, res) => {
    const { category, q } = req.query;
    try {
        const pages = await prisma.artistPage.findMany({
            where: {
                ...(category ? { category } : {}),
                ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
            },
            orderBy: { name: 'asc' },
            take: 50,
        });
        res.json(pages);
    } catch {
        res.status(500).json({ message: '取得に失敗しました' });
    }
};

export const getArtistProjects = async (req, res) => {
    const { slug } = req.params;
    try {
        const projects = await prisma.project.findMany({
            where: {
                artistPageSlug: slug,
                status: { not: 'REJECTED' },
                visibility: 'PUBLIC',
            },
            include: {
                planner: { select: { handleName: true, iconUrl: true } },
                _count: { select: { pledges: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
        res.json(projects);
    } catch {
        res.status(500).json({ message: '取得に失敗しました' });
    }
};

export const upsertArtistPage = async (req, res) => {
    const { slug } = req.params;
    if (req.user.role !== 'ADMIN') return res.status(403).json({ message: '管理者のみ操作可能です' });

    // スキーマに存在するフィールドのみ許可（スキーマ汚染防止）
    const {
        name,
        nameKana,
        category,
        description,
        coverImageUrl,
        iconUrl,
        twitterUrl,
        youtubeUrl,
        officialUrl,
        verified,
    } = req.body;

    const payload = {
        name,
        nameKana,
        category,
        description: description?.slice(0, 2000) ?? undefined,
        coverImageUrl,
        iconUrl,
        twitterUrl,
        youtubeUrl,
        officialUrl,
        verified,
    };

    // undefined のキーを除去して Prisma に余分な null を渡さない
    Object.keys(payload).forEach(
        (k) => payload[k] === undefined && delete payload[k]
    );

    try {
        const page = await prisma.artistPage.upsert({
            where: { slug },
            update: { ...payload, slug },
            create: { ...payload, slug },
        });
        res.json(page);
    } catch {
        res.status(500).json({ message: '保存に失敗しました' });
    }
};
