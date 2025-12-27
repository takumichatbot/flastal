import express from 'express';
import * as venueController from '../controllers/venueController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// ==========================================
// 会場関連 (Base Path: /api)
// ==========================================

// 一般：会場一覧
router.get('/venues', venueController.getVenues);

// 管理者：全会場取得（未承認含む）
// GET /api/venues/admin
router.get('/venues/admin', authenticateToken, venueController.getVenues);

// 管理者・一般：特定の会場詳細
router.get('/venues/:id', venueController.getVenueById);

// 会場登録 (POST /api/venues)
router.post('/venues', authenticateToken, venueController.addVenueByUser);

// プロフィール更新 / 会場承認 (PATCH /api/venues/:id)
// ★ ここを venueController.updateVenueProfile に統一します
router.patch('/venues/:id', authenticateToken, venueController.updateVenueProfile);

// 会場削除 (DELETE /api/venues/:id)
router.delete('/venues/:id', authenticateToken, venueController.deleteEvent || venueController.deleteVenue);

// 物流情報
router.post('/venues/:venueId/logistics', authenticateToken, venueController.postLogisticsInfo);
router.get('/venues/:venueId/logistics', venueController.postLogisticsInfo);
router.patch('/logistics/:infoId/helpful', authenticateToken, venueController.markLogisticsHelpful);

// ==========================================
// イベント関連 (Base Path: /api)
// ==========================================
router.get('/events', venueController.getEvents);
router.get('/events/public', venueController.getEvents);
router.get('/events/:id', venueController.getEventById);
router.post('/events', authenticateToken, venueController.createEvent);
router.post('/events/:id/interest', authenticateToken, venueController.toggleInterest);
router.post('/events/:id/report', authenticateToken, venueController.reportEvent);

export default router;