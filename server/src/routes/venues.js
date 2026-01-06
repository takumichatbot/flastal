import express from 'express';
import * as venueController from '../controllers/venueController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// ==========================================
// 1. 静的ルート (特定のキーワードを持つパスを最優先)
// ==========================================

// 管理者用：会場一覧取得
router.get('/admin/all', authenticateToken, venueController.getVenues);

// 一般：会場一覧取得
router.get('/', venueController.getVenues);

// イベント関連
router.get('/events/list', venueController.getEvents);
router.get('/events/public', venueController.getEvents);
router.post('/events', authenticateToken, venueController.createEvent);

// ==========================================
// 2. 動的ルート (ID指定などは中間に配置)
// ==========================================

// イベント詳細・更新・削除
router.get('/events/:id', venueController.getEventById);
router.patch('/events/:id', authenticateToken, venueController.updateEvent);
router.delete('/events/:id', authenticateToken, venueController.deleteEvent);

// 会場詳細取得 (これが /venues/admin より上にあると admin が ID と誤認されるため順序に注意)
router.get('/:id', venueController.getVenueById);

// 会場登録
router.post('/', authenticateToken, venueController.addVenueByUser);

// プロフィール更新
router.patch('/:id', authenticateToken, venueController.updateVenueProfile);

// 会場削除
router.delete('/:id', authenticateToken, venueController.deleteVenue);

// ==========================================
// 3. 物流・ダッシュボード関連
// ==========================================

// 物流情報 (搬入ルールなど)
router.get('/:venueId/logistics', venueController.getLogisticsInfo);
router.post('/:venueId/logistics', authenticateToken, venueController.postLogisticsInfo);

export default router;