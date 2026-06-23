import express from 'express';
import { getMessages, sendMessage, getUnreadCount } from '../controllers/orderChatController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 花屋向け未読件数（特定の注文に依存しないので /orders/unread-count を先に定義）
router.get('/orders/unread-count', authenticateToken, getUnreadCount);

// 注文ごとのメッセージ一覧取得
router.get('/orders/:orderId/messages', authenticateToken, getMessages);

// 注文ごとのメッセージ送信
router.post('/orders/:orderId/messages', authenticateToken, sendMessage);

export default router;
