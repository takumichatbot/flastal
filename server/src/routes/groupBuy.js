import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getGroupBuys,
  getGroupBuy,
  createGroupBuy,
  joinGroupBuy,
} from '../controllers/groupBuyController.js';

const router = Router();

// GET /api/group-buys?projectId=xxx  → 一覧取得
router.get('/', getGroupBuys);

// GET /api/group-buys/:id            → 詳細取得
router.get('/:id', getGroupBuy);

// POST /api/group-buys               → 新規作成（主催者のみ）
router.post('/', authenticateToken, createGroupBuy);

// POST /api/group-buys/:id/join      → 参加（Stripe Checkout）
router.post('/:id/join', authenticateToken, joinGroupBuy);

export default router;
