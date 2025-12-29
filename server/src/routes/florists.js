import express from 'express';
import * as floristController from '../controllers/floristController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// ==========================================
// 1. 静的ルート（具体的なパス）を先に定義する
// ==========================================

// 自身のプロフィール取得
router.get('/profile', authenticateToken, floristController.getFloristProfile);

// オファー・スケジュール取得
router.get('/offers', authenticateToken, floristController.getSchedule);
router.get('/schedule', authenticateToken, floristController.getSchedule);

// ダッシュボード
router.get('/dashboard', authenticateToken, floristController.getFloristProfile);

// マッチングAI
router.post('/match-ai', authenticateToken, floristController.matchFloristsByAi);

// 共通機能
router.get('/payouts', authenticateToken, floristController.getPayouts);
router.post('/request-payout', authenticateToken, floristController.requestPayout);
router.post('/posts', authenticateToken, floristController.createFloristPost);
router.get('/deals', authenticateToken, floristController.getMyDeals);
router.post('/deals', authenticateToken, floristController.createDeal);

// ==========================================
// 2. 準静的ルート（PATCHなど）
// ==========================================
router.patch('/profile', authenticateToken, floristController.updateFloristProfile);
router.post('/offers', authenticateToken, floristController.createOffer);
router.patch('/offers/:offerId', authenticateToken, floristController.respondToOffer);
router.post('/quotations', authenticateToken, floristController.createQuotation);
router.patch('/quotations/:id/approve', authenticateToken, floristController.approveQuotation);
router.patch('/quotations/:id/finalize', authenticateToken, floristController.finalizeQuotation);
router.post('/posts/:postId/like', authenticateToken, floristController.likeFloristPost);

// ==========================================
// 3. 動的ルート（パラメータ）は最後に置く
// ==========================================

// 全体検索
router.get('/', floristController.getFlorists);

// 個別詳細
// ★これが profile 等より上にあると、/profile が ID="profile" として扱われてしまいます。
router.get('/:id', floristController.getFloristById);

export default router;