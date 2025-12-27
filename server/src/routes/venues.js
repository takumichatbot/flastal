import express from 'express';
import * as venueController from '../controllers/venueController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// ==========================================
// 会場関連 ( Base Path: /api )
// ==========================================

// 一般公開用一覧
router.get('/venues', venueController.getVenues);

// 管理者用一覧（未承認含む）
router.get('/venues/admin', authenticateToken, venueController.getVenues);

// 詳細取得
router.get('/venues/:id', venueController.getVenueById);

// 新規登録
router.post('/venues', authenticateToken, venueController.addVenueByUser);

/**
 * 会場承認・更新
 * PATCH /api/venues/:id
 * 【重要】既存の venues/profile ルートと衝突しないよう、IDパラメータを優先
 */
router.patch('/venues/:id', authenticateToken, venueController.updateVenueProfile);

// プロフィール更新（自分用）
router.patch('/venues/profile', authenticateToken, venueController.updateVenueProfile); 

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