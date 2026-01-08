import express from 'express';
import * as eventController from '../controllers/eventController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// --- 公開エンドポイント ---
// イベント一覧取得: /api/events/public
router.get('/public', eventController.getEvents);

// --- 認証が必要な登録系 ---
// AI解析登録: /api/events/ai-parse
router.post('/ai-parse', authenticateToken, eventController.aiParseEvent);

// ユーザー手動登録: /api/events/user-submit
router.post('/user-submit', authenticateToken, eventController.createEvent);

// --- ID指定の操作 ---
// 詳細取得
router.get('/:id', eventController.getEventById);

// 興味あり: /api/events/:id/interest
router.post('/:id/interest', authenticateToken, eventController.toggleInterest);

// 更新・削除
router.patch('/:id', authenticateToken, eventController.updateEvent);
router.delete('/:id', authenticateToken, eventController.deleteEvent);

export default router;