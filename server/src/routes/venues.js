import express from 'express';
import * as venueController from '../controllers/venueController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// ==========================================
// 会場関連 ( /api/venues... )
// ==========================================
router.get('/venues', venueController.getVenues); // app.jsで /api マウントなら /api/venues
router.get('/venues/:id', venueController.getVenueById);
router.post('/venues/add', authenticateToken, venueController.addVenueByUser);
router.patch('/venues/profile', authenticateToken, venueController.updateVenueProfile); 
router.post('/venues/:venueId/logistics', authenticateToken, venueController.postLogisticsInfo);
router.get('/venues/:venueId/logistics', authenticateToken, venueController.postLogisticsInfo); // (GETも必要なら追加)
router.patch('/logistics/:infoId/helpful', authenticateToken, venueController.markLogisticsHelpful);

// ==========================================
// イベント関連 ( /api/events... )
// ==========================================
// ★ ここを /events から開始することで、元の /api/events と一致させます
router.get('/events', venueController.getEvents);
router.get('/events/public', venueController.getEvents); // 検索用
router.get('/events/:id', venueController.getEventById);
router.post('/events', authenticateToken, venueController.createEvent);
router.post('/events/:id/interest', authenticateToken, venueController.toggleInterest);
router.post('/events/:id/report', authenticateToken, venueController.reportEvent);
router.post('/events/user-submit', authenticateToken, venueController.createEvent); // ユーザー投稿

// 主催者イベント ( /api/organizers/events )
router.get('/organizers/events', authenticateToken, venueController.getOrganizerEvents); 

// イベント編集・削除
router.patch('/events/:id', authenticateToken, venueController.updateEvent);
router.delete('/events/:id', authenticateToken, venueController.deleteEvent);

export default router;