import prisma from '../config/prisma.js';
import { logger } from '../utils/logger.js';

export const getRecommendedProjects = async (req, res) => {
  try {
    const userId = req.user?.id;
    const limit = 8;

    // 未ログインまたは支援履歴なし → 人気順（支援者数多い順）のFUNDRAISINGプロジェクト
    if (!userId) {
      const popular = await prisma.project.findMany({
        where: { status: 'FUNDRAISING' },
        include: {
          _count: { select: { pledges: true } },
          florist: { select: { shopName: true } },
          venue: { select: { venueName: true } },
        },
        orderBy: { pledges: { _count: 'desc' } },
        take: limit,
      });
      return res.json({ projects: popular, type: 'popular' });
    }

    // 自分が支援した企画のタグ・targetArtist を収集
    const myPledges = await prisma.pledge.findMany({
      where: { userId },
      include: {
        project: {
          select: { tags: true, targetArtist: true, deliveryAddress: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    if (myPledges.length === 0) {
      // 支援履歴なし → 人気順
      const popular = await prisma.project.findMany({
        where: { status: 'FUNDRAISING' },
        include: {
          _count: { select: { pledges: true } },
          florist: { select: { shopName: true } },
          venue: { select: { venueName: true } },
        },
        orderBy: { pledges: { _count: 'desc' } },
        take: limit,
      });
      return res.json({ projects: popular, type: 'popular' });
    }

    // タグ・アーティスト名を収集
    const allTags = myPledges.flatMap(p => p.project?.tags || []);
    const artists = [...new Set(myPledges.map(p => p.project?.targetArtist).filter(Boolean))];
    const alreadyPledgedIds = myPledges.map(p => p.projectId).filter(Boolean);

    // OR 条件を構築（タグ・アーティストが一致するFUNDRAISINGプロジェクト、支援済みを除く）
    const orConditions = [];
    if (allTags.length > 0) orConditions.push({ tags: { hasSome: allTags } });
    if (artists.length > 0) orConditions.push({ targetArtist: { in: artists } });

    const whereClause = {
      status: 'FUNDRAISING',
      ...(alreadyPledgedIds.length > 0 && { id: { notIn: alreadyPledgedIds } }),
      ...(orConditions.length > 0 && { OR: orConditions }),
    };

    const recommended = await prisma.project.findMany({
      where: whereClause,
      include: {
        _count: { select: { pledges: true } },
        florist: { select: { shopName: true } },
        venue: { select: { venueName: true } },
      },
      orderBy: { pledges: { _count: 'desc' } },
      take: limit,
    });

    // 足りなければ人気順で補完
    if (recommended.length < limit) {
      const excludeIds = [
        ...alreadyPledgedIds,
        ...recommended.map(p => p.id),
      ];
      const fallback = await prisma.project.findMany({
        where: {
          status: 'FUNDRAISING',
          ...(excludeIds.length > 0 && { id: { notIn: excludeIds } }),
        },
        include: {
          _count: { select: { pledges: true } },
          florist: { select: { shopName: true } },
          venue: { select: { venueName: true } },
        },
        orderBy: { pledges: { _count: 'desc' } },
        take: limit - recommended.length,
      });
      recommended.push(...fallback);
    }

    res.json({ projects: recommended, type: 'personalized' });
  } catch (err) {
    logger.error('Error', { context: 'recommendController', error: err.message });
    res.status(500).json({ message: 'サーバーエラーが発生しました。' });
  }
};
