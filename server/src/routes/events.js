import express from 'express';
import * as venueController from '../controllers/venueController.js';
import * as eventController from '../controllers/eventController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 公開イベント取得 (フロントの /api/events/public に対応)
router.get('/public', venueController.getEvents);

// AI解析 (フロントの /api/events/ai-parse に対応)
router.post('/ai-parse', authenticateToken, eventController.aiParseEvent);

// ユーザー投稿 (フロントの /api/events/user-submit に対応)
router.post('/user-submit', authenticateToken, venueController.createEvent);

// 詳細・更新・削除
router.get('/:id', venueController.getEventById);
router.patch('/:id', authenticateToken, venueController.updateEvent);
router.delete('/:id', authenticateToken, venueController.deleteEvent);

// 興味あり
router.post('/:id/interest', authenticateToken, venueController.toggleInterest);

export default router;