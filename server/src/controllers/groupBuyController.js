import prisma from '../config/prisma.js';
import Stripe from 'stripe';
import { sendPushNotification } from '../utils/notification.js';
import { logger } from '../utils/logger.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ─────────────────────────────────────────
// グループ購入一覧取得（?projectId=xxx）
// ─────────────────────────────────────────
export const getGroupBuys = async (req, res) => {
  try {
    const { projectId } = req.query;
    const where = projectId ? { projectId } : {};

    const groupBuys = await prisma.groupBuy.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { entries: { where: { status: 'PAID' } } } },
        entries: {
          where: { status: 'PAID' },
          select: { slots: true },
        },
      },
    });

    const result = groupBuys.map((gb) => {
      const soldSlots = gb.entries.reduce((sum, e) => sum + e.slots, 0);
      return {
        id: gb.id,
        projectId: gb.projectId,
        title: gb.title,
        description: gb.description,
        pricePerSlot: gb.pricePerSlot,
        targetSlots: gb.targetSlots,
        maxSlots: gb.maxSlots,
        status: gb.status,
        deadline: gb.deadline,
        createdAt: gb.createdAt,
        soldSlots,
        participantCount: gb._count.entries,
      };
    });

    res.json(result);
  } catch (err) {
    logger.error('getGroupBuys error', { context: 'GroupBuy', error: err.message });
    res.status(500).json({ message: 'グループ購入一覧の取得に失敗しました。' });
  }
};

// ─────────────────────────────────────────
// グループ購入詳細取得
// ─────────────────────────────────────────
export const getGroupBuy = async (req, res) => {
  try {
    const { id } = req.params;
    const gb = await prisma.groupBuy.findUnique({
      where: { id },
      include: {
        entries: {
          where: { status: 'PAID' },
          include: {
            user: { select: { id: true, handleName: true, iconUrl: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!gb) return res.status(404).json({ message: 'グループ購入が見つかりません。' });

    const soldSlots = gb.entries.reduce((sum, e) => sum + e.slots, 0);

    res.json({ ...gb, soldSlots });
  } catch (err) {
    logger.error('getGroupBuy error', { context: 'GroupBuy', error: err.message });
    res.status(500).json({ message: 'グループ購入の取得に失敗しました。' });
  }
};

// ─────────────────────────────────────────
// グループ購入作成（プロジェクト主催者のみ）
// ─────────────────────────────────────────
export const createGroupBuy = async (req, res) => {
  try {
    const userId = req.user.id;
    const { projectId, title, description, pricePerSlot, targetSlots, maxSlots, deadline } = req.body;

    if (!projectId || !title || !pricePerSlot || !targetSlots || !deadline) {
      return res.status(400).json({ message: '必須項目が不足しています。' });
    }

    // プロジェクト主催者チェック
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { plannerId: true },
    });

    if (!project) return res.status(404).json({ message: 'プロジェクトが見つかりません。' });
    if (project.plannerId !== userId) {
      return res.status(403).json({ message: 'プロジェクトの主催者のみグループ購入を作成できます。' });
    }

    if (pricePerSlot < 1) return res.status(400).json({ message: '一口金額は1円以上にしてください。' });
    if (targetSlots < 1) return res.status(400).json({ message: '目標口数は1以上にしてください。' });

    const groupBuy = await prisma.groupBuy.create({
      data: {
        projectId,
        title,
        description: description || null,
        pricePerSlot: parseInt(pricePerSlot),
        targetSlots: parseInt(targetSlots),
        maxSlots: maxSlots ? parseInt(maxSlots) : null,
        deadline: new Date(deadline),
        status: 'OPEN',
      },
    });

    res.status(201).json(groupBuy);
  } catch (err) {
    logger.error('createGroupBuy error', { context: 'GroupBuy', error: err.message });
    res.status(500).json({ message: 'グループ購入の作成に失敗しました。' });
  }
};

// ─────────────────────────────────────────
// グループ購入に参加（Stripe Checkout作成）
// ─────────────────────────────────────────
export const joinGroupBuy = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { slots = 1 } = req.body;

    const slotsNum = parseInt(slots);
    if (isNaN(slotsNum) || slotsNum < 1 || slotsNum > 10) {
      return res.status(400).json({ message: '口数は1〜10の範囲で指定してください。' });
    }

    const gb = await prisma.groupBuy.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, title: true } },
        entries: { where: { status: 'PAID' }, select: { slots: true } },
      },
    });

    if (!gb) return res.status(404).json({ message: 'グループ購入が見つかりません。' });
    if (gb.status !== 'OPEN') return res.status(400).json({ message: 'このグループ購入は受付終了しています。' });
    if (new Date() > new Date(gb.deadline)) {
      return res.status(400).json({ message: '申込締切を過ぎています。' });
    }

    // 上限チェック
    if (gb.maxSlots !== null) {
      const soldSlots = gb.entries.reduce((sum, e) => sum + e.slots, 0);
      if (soldSlots + slotsNum > gb.maxSlots) {
        return res.status(400).json({ message: '残り口数が不足しています。' });
      }
    }

    const amount = gb.pricePerSlot * slotsNum;
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'jpy',
            product_data: {
              name: `${gb.title}（${slotsNum}口）`,
              description: gb.project.title,
            },
            unit_amount: gb.pricePerSlot,
          },
          quantity: slotsNum,
        },
      ],
      mode: 'payment',
      success_url: `${FRONTEND_URL}/projects/${gb.project.id}?group_buy=success`,
      cancel_url: `${FRONTEND_URL}/group-buy/${id}`,
      metadata: {
        type: 'group_buy',
        groupBuyId: id,
        projectId: gb.project.id,
        userId,
        slots: String(slotsNum),
        amount: String(amount),
      },
    });

    // PENDING エントリを先行作成
    await prisma.groupBuyEntry.create({
      data: {
        groupBuyId: id,
        userId,
        slots: slotsNum,
        amount,
        stripeSessionId: session.id,
        status: 'PENDING',
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    logger.error('joinGroupBuy error', { context: 'GroupBuy', error: err.message });
    res.status(500).json({ message: '参加処理に失敗しました。' });
  }
};

// ─────────────────────────────────────────
// Webhookから呼ばれる：支払い完了処理
// ─────────────────────────────────────────
export const fulfillGroupBuyEntry = async (stripeSession) => {
  const { groupBuyId, userId, slots, amount } = stripeSession.metadata || {};

  // メタデータ必須項目の検証（トランザクション開始前に弾く）
  if (!groupBuyId || !slots || !amount) {
    logger.error('Missing required metadata', { context: 'GroupBuy', meta: stripeSession.metadata });
    throw new Error(`GroupBuy metadata incomplete: session=${stripeSession.id}`);
  }

  // GroupBuy の存在確認（トランザクション開始前に確認し、無駄なロックを避ける）
  const gbExists = await prisma.groupBuy.findUnique({
    where: { id: groupBuyId },
    select: { id: true },
  });
  if (!gbExists) {
    logger.error('GroupBuy not found', { context: 'GroupBuy', groupBuyId });
    throw new Error(`GroupBuy not found: ${groupBuyId}`);
  }

  await prisma.$transaction(async (tx) => {
    // GroupBuyEntry を PAID に更新
    const entry = await tx.groupBuyEntry.update({
      where: { stripeSessionId: stripeSession.id },
      data: {
        status: 'PAID',
        stripePaymentId: stripeSession.payment_intent || null,
      },
    });

    // 目標口数達成チェック
    const gb = await tx.groupBuy.findUnique({
      where: { id: groupBuyId },
      include: {
        entries: { where: { status: 'PAID' }, select: { slots: true } },
      },
    });

    if (!gb) throw new Error(`GroupBuy not found: ${groupBuyId}`);

    const totalSoldSlots = gb.entries.reduce((sum, e) => sum + e.slots, 0);

    if (gb.status === 'OPEN' && totalSoldSlots >= gb.targetSlots) {
      await tx.groupBuy.update({
        where: { id: groupBuyId },
        data: { status: 'FUNDED' },
      });
      logger.info('GroupBuy FUNDED', { context: 'GroupBuy', groupBuyId, soldSlots: totalSoldSlots, targetSlots: gb.targetSlots });
    }
  });

  logger.info('Entry fulfilled', { context: 'GroupBuy', session: stripeSession.id, groupBuyId });

  // グループ購入成立時：PAIDエントリのユーザー全員にWeb Push通知を送る
  // トランザクション外で実行し、失敗してもWebhook処理に影響させない
  try {
    const gbAfter = await prisma.groupBuy.findUnique({ where: { id: groupBuyId } });
    if (gbAfter && gbAfter.status === 'FUNDED') {
      const entries = await prisma.groupBuyEntry.findMany({
        where: { groupBuyId, status: 'PAID', userId: { not: null } },
        select: { userId: true },
      });
      for (const e of entries) {
        sendPushNotification(e.userId, {
          title: '🎉 グループ購入が成立しました！',
          body: `「${gbAfter.title}」が目標口数に達しました`,
          url: `/group-buy/${groupBuyId}`,
        }).catch(() => {});
      }
    }
  } catch (err) {
    logger.warn('Push notification error', { context: 'GroupBuy', error: err.message });
  }
};
