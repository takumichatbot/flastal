import prisma from '../config/prisma.js';
import { logger } from '../utils/logger.js';

// ───────────────────────────────────────────────────────────────
// アーティストページ フォロー / アンフォロー
// ───────────────────────────────────────────────────────────────
export const toggleArtistFollow = async (req, res) => {
  try {
    const userId = req.user.id;
    const { artistPageId } = req.body;

    if (!artistPageId) {
      return res.status(400).json({ message: 'artistPageId は必須です' });
    }

    const existing = await prisma.artistPageFollow.findUnique({
      where: { userId_artistPageId: { userId, artistPageId } },
    });

    if (existing) {
      await prisma.artistPageFollow.delete({
        where: { userId_artistPageId: { userId, artistPageId } },
      });
      return res.json({ following: false });
    }

    await prisma.artistPageFollow.create({ data: { userId, artistPageId } });
    res.json({ following: true });
  } catch (err) {
    logger.error('toggleArtistFollow error', { context: 'feedController', error: err.message });
    res.status(500).json({ message: 'サーバーエラーが発生しました' });
  }
};

// ───────────────────────────────────────────────────────────────
// ユーザー フォロー / アンフォロー（既存 Follow モデル使用）
// ───────────────────────────────────────────────────────────────
export const toggleUserFollow = async (req, res) => {
  try {
    const followerId = req.user.id;
    const { followingId } = req.body;

    if (!followingId) {
      return res.status(400).json({ message: 'followingId は必須です' });
    }
    if (followerId === followingId) {
      return res.status(400).json({ message: '自分自身はフォローできません' });
    }

    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });

    if (existing) {
      await prisma.follow.delete({
        where: { followerId_followingId: { followerId, followingId } },
      });
      return res.json({ following: false });
    }

    await prisma.follow.create({ data: { followerId, followingId } });
    res.json({ following: true });
  } catch (err) {
    logger.error('toggleUserFollow error', { context: 'feedController', error: err.message });
    res.status(500).json({ message: 'サーバーエラーが発生しました' });
  }
};

// ───────────────────────────────────────────────────────────────
// アクティビティフィード取得
// ───────────────────────────────────────────────────────────────
export const getFeed = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = 20;

    // フォロー中のユーザー ID 一覧
    const userFollows = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followingUserIds = userFollows.map((f) => f.followingId);

    // フォロー中のアーティストページ ID 一覧
    const artistFollows = await prisma.artistPageFollow.findMany({
      where: { userId },
      select: { artistPageId: true },
    });
    const followingArtistIds = artistFollows.map((f) => f.artistPageId);

    if (followingUserIds.length === 0 && followingArtistIds.length === 0) {
      return res.json({ items: [], hasMore: false });
    }

    // フォロー中ユーザーが主催 OR フォロー中アーティストに紐づくプロジェクト
    const whereClause = {
      status: { in: ['FUNDRAISING', 'SUCCESSFUL', 'COMPLETED'] },
      visibility: 'PUBLIC',
      OR: [],
    };

    if (followingUserIds.length > 0) {
      whereClause.OR.push({ plannerId: { in: followingUserIds } });
    }
    if (followingArtistIds.length > 0) {
      whereClause.OR.push({ artistPageId: { in: followingArtistIds } });
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        planner: { select: { id: true, handleName: true, iconUrl: true } },
        _count: { select: { pledges: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const items = projects.map((p) => ({
      id: p.id,
      type: p.status === 'COMPLETED' ? 'PROJECT_COMPLETED' : 'PROJECT_CREATED',
      project: p,
      actor: p.planner,
      createdAt: p.updatedAt,
    }));

    res.json({ items, hasMore: items.length === limit });
  } catch (err) {
    logger.error('getFeed error', { context: 'feedController', error: err.message });
    res.status(500).json({ message: 'サーバーエラーが発生しました' });
  }
};

// ───────────────────────────────────────────────────────────────
// フォロー状態確認
// ───────────────────────────────────────────────────────────────
export const getFollowStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { artistPageId, followingId } = req.query;

    if (artistPageId) {
      const f = await prisma.artistPageFollow.findUnique({
        where: { userId_artistPageId: { userId, artistPageId } },
      });
      return res.json({ following: !!f });
    }

    if (followingId) {
      const f = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: userId, followingId } },
      });
      return res.json({ following: !!f });
    }

    res.json({ following: false });
  } catch (err) {
    logger.error('getFollowStatus error', { context: 'feedController', error: err.message });
    res.status(500).json({ message: 'サーバーエラーが発生しました' });
  }
};
