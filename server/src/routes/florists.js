import express from 'express';
import * as floristController from '../controllers/floristController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// ==========================================
// ★ 優先ルート (静的パスを動的パスの前に置く)
// ==========================================

// 1. ログイン中のお花屋さん自身のプロフィール取得
// フロントエンド `${API_URL}/api/florists/profile` に対応
router.get('/profile', authenticateToken, floristController.getFloristProfile);

// 2. お花屋さんダッシュボード用データ取得
// フロントエンド `${API_URL}/api/florists/dashboard` に対応
router.get('/dashboard', authenticateToken, floristController.getFloristProfile); 

// 3. マッチングAI
router.post('/match-ai', authenticateToken, floristController.matchFloristsByAi);

// ==========================================
// お花屋さん検索・詳細
// ==========================================
router.get('/', floristController.getFlorists);
router.get('/:id', floristController.getFloristById);

// プロフィール更新
router.patch('/profile', authenticateToken, floristController.updateFloristProfile);
router.get('/schedule', authenticateToken, floristController.getSchedule);

// ==========================================
// ★ オファー・見積もり
// ==========================================
router.post('/offers', authenticateToken, floristController.createOffer);
router.patch('/offers/:offerId', authenticateToken, floristController.respondToOffer);
router.post('/quotations', authenticateToken, floristController.createQuotation);
router.patch('/quotations/:id/approve', authenticateToken, floristController.approveQuotation);
router.patch('/quotations/:id/finalize', authenticateToken, floristController.finalizeQuotation);

// ==========================================
// ★ 出金・売上
// ==========================================
router.get('/payouts', authenticateToken, floristController.getPayouts);
router.post('/request-payout', authenticateToken, floristController.requestPayout); 

// ==========================================
// ★ 投稿・特売
// ==========================================
router.post('/posts', authenticateToken, floristController.createFloristPost);
router.post('/posts/:postId/like', authenticateToken, floristController.likeFloristPost);

router.post('/deals', authenticateToken, floristController.createDeal);
router.get('/deals', authenticateToken, floristController.getMyDeals);

// 特売検索
router.get('/deals/search', floristController.searchDeals);

export default router;