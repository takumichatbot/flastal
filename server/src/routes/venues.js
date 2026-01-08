import express from 'express';
import * as venueController from '../controllers/venueController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// --- 会場関連ルート ---
// 管理者用一覧
router.get('/admin', authenticateToken, venueController.getVenues);

// 一般一覧
router.get('/', venueController.getVenues);

// 会場詳細取得
router.get('/:id', venueController.getVenueById);

// 物流情報
router.get('/:venueId/logistics', venueController.getLogisticsInfo);
router.post('/:venueId/logistics', authenticateToken, venueController.postLogisticsInfo);

// 登録・更新・削除 (会場)
router.post('/', authenticateToken, venueController.addVenueByUser);
router.patch('/:id', authenticateToken, venueController.updateVenueProfile);
router.delete('/:id', authenticateToken, venueController.deleteVenue);

export default router;