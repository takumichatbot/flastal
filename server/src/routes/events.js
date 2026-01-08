import express from 'express';
import * as venueController from '../controllers/venueController.js';
import * as eventController from '../controllers/eventController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// --- 公開エンドポイント ---
// /api/events/public (EventListClient.js がここを叩く)
router.get('/public', venueController.getEvents);

// --- 認証が必要な登録系 ---
// AI解析登録: /api/events/ai-parse
router.post('/ai-parse', authenticateToken, eventController.aiParseEvent);

// ユーザー手動登録: /api/events/user-submit
router.post('/user-submit', authenticateToken, venueController.createEvent);

// --- ID指定の操作 ---
// 詳細取得
router.get('/:id', venueController.getEventById);

// 興味あり: /api/events/:id/interest
router.post('/:id/interest', authenticateToken, venueController.toggleInterest);

// 更新・削除
router.patch('/:id', authenticateToken, venueController.updateEvent);
router.delete('/:id', authenticateToken, venueController.deleteEvent);

export default router;