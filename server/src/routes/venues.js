import express from 'express';
import * as venueController from '../controllers/venueController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 一般：会場一覧
router.get('/venues', venueController.getVenues);

// 管理者：会場一覧 (admin)
router.get('/venues/admin', authenticateToken, venueController.getVenues);

// 詳細取得
router.get('/venues/:id', venueController.getVenueById);

// 登録
router.post('/venues', authenticateToken, venueController.addVenueByUser);

// 更新・承認
router.patch('/venues/:id', authenticateToken, venueController.updateVenueProfile);

// 削除
router.delete('/venues/:id', authenticateToken, venueController.deleteVenue);

// 物流
router.post('/venues/:venueId/logistics', authenticateToken, venueController.postLogisticsInfo);
router.get('/venues/:venueId/logistics', venueController.postLogisticsInfo);

// イベント
router.get('/events', venueController.getEvents);
router.get('/events/public', venueController.getEvents);
router.get('/events/:id', venueController.getEventById);
router.post('/events', authenticateToken, venueController.createEvent);

export default router;