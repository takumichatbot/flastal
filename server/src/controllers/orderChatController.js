import prisma from '../config/prisma.js';
import { getIO } from '../config/socket.js';
import { logger } from '../utils/logger.js';

/**
 * 注文のメッセージ一覧を取得する
 * - 花屋は自分の注文のみ参照可能
 * - 管理者はすべての注文を参照可能
 * - 取得と同時に、自分宛のメッセージを既読にする
 */
export const getMessages = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { id: userId, role } = req.user;

    // 注文の存在確認と権限チェック
    const order = await prisma.shopOrder.findUnique({
      where: { id: orderId },
      select: { id: true, floristId: true },
    });

    if (!order) {
      return res.status(404).json({ message: '注文が見つかりません。' });
    }

    // 花屋は自分の注文のみアクセス可能
    if (role === 'FLORIST' && order.floristId !== userId) {
      return res.status(403).json({ message: 'この注文へのアクセス権限がありません。' });
    }

    // 自分宛のメッセージを既読にする
    const readSenderType = role === 'FLORIST' ? 'ADMIN' : 'FLORIST';
    await prisma.orderMessage.updateMany({
      where: {
        orderId,
        senderType: readSenderType,
        isRead: false,
      },
      data: { isRead: true },
    });

    // メッセージ一覧を取得
    const messages = await prisma.orderMessage.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
    });

    return res.json(messages);
  } catch (error) {
    logger.error('getMessages error', { context: 'OrderChat', error: error.message });
    return res.status(500).json({ message: 'メッセージの取得に失敗しました。' });
  }
};

/**
 * メッセージを送信する
 * - senderType は req.user.role から自動判定（FLORIST or ADMIN）
 * - 送信後、Socket.io で `order-chat:${orderId}` ルームにブロードキャスト
 */
export const sendMessage = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { content } = req.body;
    const { id: userId, role } = req.user;

    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'メッセージを入力してください。' });
    }
    if (content.length > 5000) {
      return res.status(400).json({ message: 'メッセージは5000文字以内で入力してください。' });
    }

    // 花屋・管理者のみ送信可能
    if (role !== 'FLORIST' && role !== 'ADMIN') {
      return res.status(403).json({ message: 'メッセージ送信の権限がありません。' });
    }

    // 注文の存在確認と権限チェック
    const order = await prisma.shopOrder.findUnique({
      where: { id: orderId },
      select: { id: true, floristId: true },
    });

    if (!order) {
      return res.status(404).json({ message: '注文が見つかりません。' });
    }

    // 花屋は自分の注文のみアクセス可能
    if (role === 'FLORIST' && order.floristId !== userId) {
      return res.status(403).json({ message: 'この注文へのアクセス権限がありません。' });
    }

    const senderType = role === 'FLORIST' ? 'FLORIST' : 'ADMIN';

    const newMessage = await prisma.orderMessage.create({
      data: {
        orderId,
        senderType,
        senderId: userId,
        content: content.trim(),
      },
    });

    // Socket.io でリアルタイム配信
    try {
      const io = getIO();
      io.to(`order-chat:${orderId}`).emit('new_order_message', newMessage);
    } catch (socketErr) {
      // Socket.io が初期化されていない場合は無視
      logger.warn('Socket.io emit failed', { context: 'OrderChat', error: socketErr.message });
    }

    return res.status(201).json(newMessage);
  } catch (error) {
    logger.error('sendMessage error', { context: 'OrderChat', error: error.message });
    return res.status(500).json({ message: 'メッセージの送信に失敗しました。' });
  }
};

/**
 * 花屋向け: 全注文の未読メッセージ件数を返す
 * （管理者から届いた未読メッセージの合計）
 */
export const getUnreadCount = async (req, res) => {
  try {
    const { id: floristId, role } = req.user;

    if (role !== 'FLORIST') {
      return res.status(403).json({ message: '花屋アカウントが必要です。' });
    }

    // 自分の注文に紐づく、管理者からの未読メッセージ数を集計
    const count = await prisma.orderMessage.count({
      where: {
        order: { floristId },
        senderType: 'ADMIN',
        isRead: false,
      },
    });

    return res.json({ unreadCount: count });
  } catch (error) {
    logger.error('getUnreadCount error', { context: 'OrderChat', error: error.message });
    return res.status(500).json({ message: '未読件数の取得に失敗しました。' });
  }
};
