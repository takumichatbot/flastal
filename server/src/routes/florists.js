import express from 'express';
import * as floristController from '../controllers/floristController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// ==========================================
// ★ 最優先ルート (静的パスを一番上に置く)
// ==========================================

// 1. ログイン中のお花屋さんのプロフィール取得
// フロントエンドのリクエスト /api/florists/profile に対応
router.get('/profile', authenticateToken, floristController.getFloristProfile);

// 2. お花屋さんダッシュボード用 (profileと同じ関数を流用)
// フロントエンドのリクエスト /api/florists/dashboard に対応
router.get('/dashboard', authenticateToken, floristController.getFloristProfile);

// ==========================================
// お花屋さん検索・詳細・AI
// ==========================================
router.get('/', floristController.getFlorists);
router.post('/match-ai', authenticateToken, floristController.matchFloristsByAi);

// 動的パスは必ず最後に置く
router.get('/:id', floristController.getFloristById);

// ==========================================
// 業務・プロフィール更新
// ==========================================
router.patch('/profile', authenticateToken, floristController.updateFloristProfile);
router.get('/schedule', authenticateToken, floristController.getSchedule);

// ==========================================
// ★ オファー・見積もり・出金
// ==========================================
router.get('/offers', authenticateToken, floristController.getSchedule); // 仮：必要に応じて適切な関数へ
router.post('/offers', authenticateToken, floristController.createOffer);
router.patch('/offers/:offerId', authenticateToken, floristController.respondToOffer);
router.post('/quotations', authenticateToken, floristController.createQuotation);
router.patch('/quotations/:id/approve', authenticateToken, floristController.approveQuotation);
router.patch('/quotations/:id/finalize', authenticateToken, floristController.finalizeQuotation);

router.get('/payouts', authenticateToken, floristController.getPayouts);
router.post('/request-payout', authenticateToken, floristController.requestPayout); 

// ==========================================
// ★ 投稿・特売
// ==========================================
router.post('/posts', authenticateToken, floristController.createFloristPost);
router.post('/posts/:postId/like', authenticateToken, floristController.likeFloristPost);
router.post('/deals', authenticateToken, floristController.createDeal);
router.get('/deals', authenticateToken, floristController.getMyDeals);

export default router;