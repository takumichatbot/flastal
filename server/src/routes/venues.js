import express from 'express';
import * as venueController from '../controllers/venueController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// ==========================================
// 会場関連 ( Base Path: /api/venues )
// ==========================================

/**
 * 会場一覧取得
 * GET /api/venues
 */
router.get('/', venueController.getVenues);

/**
 * 新しい会場を登録（一般ユーザー用）
 * POST /api/venues
 * フロントエンドからの POST https://.../api/venues をここで受け取ります
 */
router.post('/', authenticateToken, venueController.addVenueByUser);

/**
 * 特定の会場詳細取得
 * GET /api/venues/:id
 */
router.get('/:id', venueController.getVenueById);

/**
 * 会場プロフィールの更新
 * PATCH /api/venues/profile
 */
router.patch('/profile', authenticateToken, venueController.updateVenueProfile); 

/**
 * 会場への物流・搬入情報の投稿
 * POST /api/venues/:venueId/logistics
 */
router.post('/:venueId/logistics', authenticateToken, venueController.postLogisticsInfo);

/**
 * 会場の物流・搬入情報の取得
 * GET /api/venues/:venueId/logistics
 */
router.get('/:venueId/logistics', authenticateToken, venueController.postLogisticsInfo);

/**
 * 物流情報への「役に立った」評価
 * PATCH /api/venues/logistics/:infoId/helpful
 */
router.patch('/logistics/:infoId/helpful', authenticateToken, venueController.markLogisticsHelpful);

// ==========================================
// イベント関連 ( Base Path: /api/events への振り分け用 )
// ==========================================
// ※本来は個別の routes/events.js に分けるべきですが、現状の依存関係を維持します

router.get('/events', venueController.getEvents);
router.get('/events/public', venueController.getEvents);
router.get('/events/:id', venueController.getEventById);
router.post('/events', authenticateToken, venueController.createEvent);
router.post('/events/:id/interest', authenticateToken, venueController.toggleInterest);
router.post('/events/:id/report', authenticateToken, venueController.reportEvent);
router.post('/events/user-submit', authenticateToken, venueController.createEvent);

// 主催者用イベント取得
router.get('/organizers/events', authenticateToken, venueController.getOrganizerEvents); 

// イベント編集・削除
router.patch('/events/:id', authenticateToken, venueController.updateEvent);
router.delete('/events/:id', authenticateToken, venueController.deleteEvent);

export default router;