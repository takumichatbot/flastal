import prisma from '../config/prisma.js';
import Stripe from 'stripe';
import { getIO } from '../config/socket.js';
import { sendPushNotification } from '../utils/notification.js';
import { logger } from '../utils/logger.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ─────────────────────────────────────────
// 配信セッション一覧（プロジェクト別）
// ─────────────────────────────────────────
export const getSessions = async (req, res) => {
  const { projectId } = req.params;
  const sessions = await prisma.liveSession.findMany({
    where: { projectId },
    include: {
      florist: { select: { id: true, shopName: true, iconUrl: true } },
      _count: { select: { superchats: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(sessions);
};

// ─────────────────────────────────────────
// 配信セッション詳細
// ─────────────────────────────────────────
export const getSession = async (req, res) => {
  const session = await prisma.liveSession.findUnique({
    where: { id: req.params.id },
    include: {
      florist: { select: { id: true, shopName: true, iconUrl: true } },
      project: { select: { id: true, title: true } },
      superchats: {
        include: { user: { select: { id: true, handleName: true, iconUrl: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
    },
  });
  if (!session) return res.status(404).json({ message: '配信が見つかりません。' });
  res.json(session);
};

// ─────────────────────────────────────────
// 配信セッション作成（花屋のみ）
// ─────────────────────────────────────────
export const createSession = async (req, res) => {
  const floristId = req.user.id;
  const { projectId, title, youtubeUrl } = req.body;

  if (!projectId || !title) return res.status(400).json({ message: '企画IDとタイトルは必須です。' });

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      plannerId: true,
      offers: {
        where: { floristId, status: 'ACCEPTED' },
        select: { id: true },
      },
    },
  });
  if (!project) return res.status(404).json({ message: '企画が見つかりません。' });

  const isAssignedFlorist = project.offers?.length > 0;
  if (!isAssignedFlorist) {
    return res.status(403).json({ message: 'この企画のライブ配信を作成する権限がありません。' });
  }

  const session = await prisma.liveSession.create({
    data: { projectId, floristId, title, youtubeUrl: youtubeUrl || null },
    include: { florist: { select: { shopName: true } } },
  });
  res.status(201).json(session);
};

// ─────────────────────────────────────────
// 配信開始・終了（花屋のみ）
// ─────────────────────────────────────────
export const updateSession = async (req, res) => {
  const floristId = req.user.id;
  const { isLive, youtubeUrl, title } = req.body;

  const existing = await prisma.liveSession.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ message: '配信が見つかりません。' });
  if (existing.floristId !== floristId) return res.status(403).json({ message: '権限がありません。' });

  const data = {};
  if (title !== undefined) data.title = title;
  if (youtubeUrl !== undefined) data.youtubeUrl = youtubeUrl;
  if (isLive !== undefined) {
    data.isLive = isLive;
    if (isLive && !existing.startedAt) data.startedAt = new Date();
    if (!isLive && existing.isLive) data.endedAt = new Date();
  }

  const session = await prisma.liveSession.update({
    where: { id: req.params.id },
    data,
  });

  // Socket.ioで視聴者へ配信状態変化を通知
  try {
    const io = getIO();
    io.to(`live:${req.params.id}`).emit('session_updated', { isLive: session.isLive });
  } catch { /* Socket未接続の場合は無視 */ }

  // ライブ配信開始時：支援者全員にWeb Push通知を送る
  if (isLive === true || isLive === 'true') {
    try {
      const pledgers = await prisma.pledge.findMany({
        where: { projectId: session.projectId, userId: { not: null } },
        select: { userId: true },
        distinct: ['userId'],
      });
      for (const p of pledgers) {
        sendPushNotification(p.userId, {
          title: '🌸 制作中継が始まりました！',
          body: session.title,
          url: `/projects/${session.projectId}/live`,
        }).catch(() => {});
      }
    } catch (err) {
      logger.warn('Push notification error', { context: 'LiveController', error: err.message });
    }
  }

  res.json(session);
};

// ─────────────────────────────────────────
// スーパーチャット送信（ユーザーのみ）
// ─────────────────────────────────────────
export const sendSuperchat = async (req, res) => {
  const userId = req.user.id;
  const { amount, message, displayName } = req.body;
  const liveSessionId = req.params.id;

  const parsedAmount = parseInt(amount);
  if (!Number.isInteger(parsedAmount) || parsedAmount < 100 || parsedAmount > 100000) {
    return res.status(400).json({ message: '金額は100〜100,000円の整数で指定してください。' });
  }

  const session = await prisma.liveSession.findUnique({ where: { id: liveSessionId } });
  if (!session || !session.isLive) return res.status(400).json({ message: '現在配信中ではありません。' });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ message: 'ユーザーが見つかりません。' });

  const name = displayName || user.handleName;
  const FRONTEND_URL = process.env.FRONTEND_URL || 'https://www.flastal.com';

  const stripeSession = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'jpy',
        product_data: { name: `スーパーチャット by ${name}` },
        unit_amount: parsedAmount,
      },
      quantity: 1,
    }],
    customer_email: user.email,
    metadata: {
      type: 'superchat',
      liveSessionId,
      userId,
      amount: String(parsedAmount),
      message: message || '',
      displayName: name,
    },
    success_url: `${FRONTEND_URL}/projects/${session.projectId}/live?superchat=success&amount=${parsedAmount}`,
    cancel_url: `${FRONTEND_URL}/projects/${session.projectId}/live`,
  });

  res.json({ url: stripeSession.url });
};

// ─────────────────────────────────────────
// 視聴者数取得（Socket.IOルーム人数）
// ─────────────────────────────────────────
export const getViewerCount = async (req, res) => {
  try {
    const { id: sessionId } = req.params;
    const io = getIO();
    const room = io.sockets.adapter.rooms.get(`live:${sessionId}`);
    const count = room ? room.size : 0;
    res.json({ viewerCount: count });
  } catch (err) {
    res.json({ viewerCount: 0 });
  }
};

// ─────────────────────────────────────────
// スーパーチャット確定（Webhookから呼ぶ）
// ─────────────────────────────────────────
export const fulfillSuperchat = async (stripeSession) => {
  const { liveSessionId, userId, amount, message, displayName } = stripeSession.metadata;

  const parsedAmount = parseInt(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    throw new Error(`Invalid superchat amount in metadata: ${amount}`);
  }

  const superchat = await prisma.superchat.create({
    data: {
      liveSessionId,
      userId,
      amount: parsedAmount,
      message: message || null,
      displayName,
    },
    include: { user: { select: { handleName: true, iconUrl: true } } },
  });

  try {
    const io = getIO();
    io.to(`live:${liveSessionId}`).emit('new_superchat', superchat);
  } catch { /* ignore */ }

  return superchat;
};
