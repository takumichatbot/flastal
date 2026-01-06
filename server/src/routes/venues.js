import express from 'express';
import * as venueController from '../controllers/venueController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// --- 1. 静的ルート ---
// 管理者用
router.get('/admin/all', authenticateToken, venueController.getVenues);

// 一般：会場一覧
router.get('/', venueController.getVenues);

// イベント関連
router.get('/events/list', venueController.getEvents);
router.get('/events/public', venueController.getEvents);
router.post('/events', authenticateToken, venueController.createEvent);

// --- 2. 動的ルート (イベント) ---
router.get('/events/:id', venueController.getEventById);
router.patch('/events/:id', authenticateToken, venueController.updateEvent);
router.delete('/events/:id', authenticateToken, venueController.deleteEvent);

// --- 3. 動的ルート (会場) ---
// 詳細取得
router.get('/:id', venueController.getVenueById);

// 登録
router.post('/', authenticateToken, venueController.addVenueByUser);

// 更新
router.patch('/:id', authenticateToken, venueController.updateVenueProfile);

// 削除
router.delete('/:id', authenticateToken, venueController.deleteVenue);

// 物流情報
router.get('/:venueId/logistics', venueController.getLogisticsInfo);
router.post('/:venueId/logistics', authenticateToken, venueController.postLogisticsInfo);

export default router;