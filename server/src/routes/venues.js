import express from 'express';
import * as venueController from '../controllers/venueController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// --- 管理者・共通設定 (静的パスを先に定義) ---
router.get('/venues/admin', authenticateToken, venueController.getVenues);

// 一般：会場一覧
router.get('/venues', venueController.getVenues);

// イベント関連
router.get('/events', venueController.getEvents);
router.get('/events/public', venueController.getEvents);
router.get('/events/:id', venueController.getEventById);
router.post('/events', authenticateToken, venueController.createEvent);

// ★ 追加: イベントの更新と削除 (PATCH/DELETE)
router.patch('/events/:id', authenticateToken, venueController.updateEvent);
router.delete('/events/:id', authenticateToken, venueController.deleteEvent);

// --- 個別会場設定 (動的パス :id は後に定義) ---

// 詳細取得
router.get('/venues/:id', venueController.getVenueById);

// 登録 (一般ユーザーまたは会場アカウント)
router.post('/venues', authenticateToken, venueController.addVenueByUser);

// 更新・承認
router.patch('/venues/:id', authenticateToken, venueController.updateVenueProfile);

// 削除
router.delete('/venues/:id', authenticateToken, venueController.deleteVenue);

// 物流情報 (搬入ルールなど)
router.post('/venues/:venueId/logistics', authenticateToken, venueController.postLogisticsInfo);
router.get('/venues/:venueId/logistics', venueController.getLogisticsInfo || venueController.getVenueById); 

export default router;