import express from 'express';
import * as venueController from '../controllers/venueController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// ==========================================
// 会場関連 ( Base Path: /api/venues )
// ==========================================

// GET /api/venues - 一覧取得
router.get('/', venueController.getVenues);

// POST /api/venues - 新規登録 ★ここが最重要
router.post('/', authenticateToken, venueController.addVenueByUser);

// GET /api/venues/:id - 詳細取得
router.get('/:id', venueController.getVenueById);

// PATCH /api/venues/profile - プロフィール更新
router.patch('/profile', authenticateToken, venueController.updateVenueProfile); 

// 物流情報
router.post('/:venueId/logistics', authenticateToken, venueController.postLogisticsInfo);
router.get('/:venueId/logistics', authenticateToken, venueController.postLogisticsInfo);
router.patch('/logistics/:infoId/helpful', authenticateToken, venueController.markLogisticsHelpful);

// ==========================================
// イベント関連（暫定的にここに同居している場合）
// ==========================================
router.get('/events/list', venueController.getEvents);
router.get('/events/:id', venueController.getEventById);
router.post('/events', authenticateToken, venueController.createEvent);

export default router;