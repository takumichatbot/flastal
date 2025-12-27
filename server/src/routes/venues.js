import express from 'express';
import * as venueController from '../controllers/venueController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// ==========================================
// 会場関連 ( app.js で /api にマウントされている前提 )
// ==========================================

// 一般公開用：会場一覧
router.get('/venues', venueController.getVenues);

// 管理者用：全会場一覧（未承認含む）
// URL: GET /api/venues/admin
router.get('/venues/admin', authenticateToken, venueController.getVenues); 

// 会場詳細
router.get('/venues/:id', venueController.getVenueById);

// 会場登録（POST /api/venues）
router.post('/venues', authenticateToken, venueController.addVenueByUser);

// プロフィール更新
router.patch('/venues/profile', authenticateToken, venueController.updateVenueProfile); 

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
router.post('/events/user-submit', authenticateToken, venueController.createEvent);

// 主催者イベント
router.get('/organizers/events', authenticateToken, venueController.getOrganizerEvents); 

// 編集・削除（重要：ここも /venues/ をつける）
router.patch('/venues/:id', authenticateToken, venueController.updateEvent || venueController.updateVenueProfile); 
router.delete('/venues/:id', authenticateToken, venueController.deleteEvent);

export default router;