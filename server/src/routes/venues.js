import express from 'express';
import * as venueController from '../controllers/venueController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// ==========================================
// 会場関連 ( app.js で /api/venues としてマウントされている前提 )
// ==========================================

// GET /api/venues (一覧取得)
router.get('/', venueController.getVenues); 

// POST /api/venues (新規登録) ★ここを修正（/venues/add から / へ）
router.post('/', authenticateToken, venueController.addVenueByUser);

// GET /api/venues/:id (詳細取得)
router.get('/:id', venueController.getVenueById);

// PATCH /api/venues/profile (プロフィール更新)
router.patch('/profile', authenticateToken, venueController.updateVenueProfile); 

// 物流情報関連
router.post('/:venueId/logistics', authenticateToken, venueController.postLogisticsInfo);
router.get('/:venueId/logistics', venueController.postLogisticsInfo); // 必要に応じて
router.patch('/logistics/:infoId/helpful', authenticateToken, venueController.markLogisticsHelpful);

// ==========================================
// イベント関連 ( /api/events... )
// ==========================================
// ※ もし app.js でこの router が /api/venues に紐付いているなら、
// 以下のパスは /api/venues/events になってしまいます。
// 本来は個別の eventRoutes.js を作るのが理想ですが、現状の構成を維持します。

router.get('/events/list', venueController.getEvents); // パス重複を避けるため変更案
router.get('/events/public', venueController.getEvents);
router.get('/events/:id', venueController.getEventById);
router.post('/events', authenticateToken, venueController.createEvent);
router.post('/events/:id/interest', authenticateToken, venueController.toggleInterest);
router.post('/events/:id/report', authenticateToken, venueController.reportEvent);

export default router;