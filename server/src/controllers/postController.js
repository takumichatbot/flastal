import prisma from '../config/prisma.js';

const postSelect = {
  id: true,
  eventName: true,
  senderName: true,
  caption: true,
  imageUrl: true,
  isPublic: true,
  createdAt: true,
  user: { select: { id: true, handleName: true, iconUrl: true } },
  _count: { select: { likes: true, comments: true } },
};

// 公開フィード（全ユーザー向け・検索・並び替え対応）
export const getPublicFeed = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(20, parseInt(req.query.limit) || 12);
    const skip = (page - 1) * limit;
    const search = req.query.search?.trim() || '';
    const sort = req.query.sort || 'new'; // 'new' | 'popular'
    const userId = req.user?.id ?? null;

    const where = {
      isPublic: true,
      ...(search ? {
        OR: [
          { eventName: { contains: search, mode: 'insensitive' } },
          { caption: { contains: search, mode: 'insensitive' } },
          { user: { handleName: { contains: search, mode: 'insensitive' } } },
        ],
      } : {}),
    };

    const orderBy = sort === 'popular'
      ? [{ likes: { _count: 'desc' } }, { createdAt: 'desc' }]
      : { createdAt: 'desc' };

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          ...postSelect,
          likes: userId ? { where: { userId }, select: { id: true } } : false,
        },
      }),
      prisma.post.count({ where }),
    ]);

    const enriched = posts.map(({ likes, ...p }) => ({
      ...p,
      likedByMe: userId ? (likes?.length ?? 0) > 0 : false,
    }));

    res.json({ posts: enriched, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('getPublicFeed error:', error);
    res.status(500).json({ message: 'フィードの取得に失敗しました' });
  }
};

// 自分の投稿一覧
export const getMyPosts = async (req, res) => {
  try {
    const userId = req.user.id;
    const posts = await prisma.post.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        ...postSelect,
        likes: { where: { userId }, select: { id: true } },
      },
    });
    const enriched = posts.map(({ likes, ...p }) => ({
      ...p,
      likedByMe: (likes?.length ?? 0) > 0,
    }));
    res.json(enriched);
  } catch (error) {
    console.error('getMyPosts error:', error);
    res.status(500).json({ message: '投稿の取得に失敗しました' });
  }
};

// 投稿作成
export const createPost = async (req, res) => {
  try {
    const { eventName, senderName, caption, imageUrl, isPublic } = req.body;
    const userId = req.user.id;

    if (!eventName || !imageUrl) {
      return res.status(400).json({ message: 'イベント名と画像は必須です' });
    }

    const post = await prisma.post.create({
      data: {
        eventName,
        senderName: senderName || null,
        caption: caption || null,
        imageUrl,
        isPublic: isPublic !== false,
        userId,
      },
      select: postSelect,
    });

    res.status(201).json({ ...post, likedByMe: false });
  } catch (error) {
    console.error('createPost error:', error);
    res.status(500).json({ message: '投稿の保存に失敗しました' });
  }
};

// いいねトグル
export const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = await prisma.postLike.findUnique({
      where: { postId_userId: { postId: id, userId } },
    });

    if (existing) {
      await prisma.postLike.delete({ where: { id: existing.id } });
    } else {
      await prisma.postLike.create({ data: { postId: id, userId } });
    }

    const count = await prisma.postLike.count({ where: { postId: id } });
    res.json({ liked: !existing, count });
  } catch (error) {
    console.error('toggleLike error:', error);
    res.status(500).json({ message: 'いいねの処理に失敗しました' });
  }
};

// コメント一覧
export const getComments = async (req, res) => {
  try {
    const { id } = req.params;
    const comments = await prisma.postComment.findMany({
      where: { postId: id },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        content: true,
        createdAt: true,
        user: { select: { id: true, handleName: true, iconUrl: true } },
      },
    });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: 'コメントの取得に失敗しました' });
  }
};

// コメント追加
export const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content?.trim()) {
      return res.status(400).json({ message: 'コメントを入力してください' });
    }

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) return res.status(404).json({ message: '投稿が見つかりません' });

    const comment = await prisma.postComment.create({
      data: { postId: id, userId, content: content.trim() },
      select: {
        id: true,
        content: true,
        createdAt: true,
        user: { select: { id: true, handleName: true, iconUrl: true } },
      },
    });

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: 'コメントの送信に失敗しました' });
  }
};

// 投稿削除（自分のみ）
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) return res.status(404).json({ message: '投稿が見つかりません' });
    if (post.userId !== userId) return res.status(403).json({ message: '権限がありません' });

    await prisma.post.delete({ where: { id } });
    res.json({ message: '削除しました' });
  } catch (error) {
    res.status(500).json({ message: '削除に失敗しました' });
  }
};
