import express from 'express';
import * as venueController from '../controllers/venueController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// ==========================================
// 会場関連 ( app.js で /api にマウントされている前提 )
// ==========================================

// 会場一覧取得（一般用）
router.get('/venues', venueController.getVenues);

// 会場一覧取得（管理者用：未承認含む）
router.get('/venues/admin', authenticateToken, venueController.getVenues);

// 会場詳細取得
router.get('/venues/:id', venueController.getVenueById);

// 会場登録（POST /api/venues）
router.post('/venues', authenticateToken, venueController.addVenueByUser);

// 会場情報の更新・承認（PATCH /api/venues/:id）
// ★ venues/ を重ねず、マウントされた /api から見て /venues/:id になるよう修正
router.patch('/venues/:id', authenticateToken, venueController.updateVenueProfile); 

// 会場削除
router.delete('/venues/:id', authenticateToken, venueController.deleteEvent || venueController.deleteVenue);

// 物流情報
router.post('/venues/:venueId/logistics', authenticateToken, venueController.postLogisticsInfo);
router.get('/venues/:venueId/logistics', venueController.postLogisticsInfo);
router.patch('/logistics/:infoId/helpful', authenticateToken, venueController.markLogisticsHelpful);

// ==========================================
// イベント関連
// ==========================================
router.get('/events', venueController.getEvents);
router.get('/events/public', venueController.getEvents);
router.get('/events/:id', venueController.getEventById);
router.post('/events', authenticateToken, venueController.createEvent);
router.post('/events/:id/interest', authenticateToken, venueController.toggleInterest);
router.post('/events/:id/report', authenticateToken, venueController.reportEvent);

export default router;