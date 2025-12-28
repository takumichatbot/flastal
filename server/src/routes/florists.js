import express from 'express';
import * as floristController from '../controllers/floristController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// ==========================================
// ★ 最優先ルート (静的パスを一番上に置く)
// ==========================================

// ログイン中のお花屋さん自身のプロフィール取得
// フロントのリクエスト `${API_URL}/api/florists/profile` に対応
router.get('/profile', authenticateToken, floristController.getFloristProfile);

// オファー一覧 (dashboardで使用)
// フロントのリクエスト `${API_URL}/api/florists/offers` に対応
router.get('/offers', authenticateToken, floristController.getSchedule); // スケジュール関数を流用

// ダッシュボード用データ (profileと同じ情報を返す)
router.get('/dashboard', authenticateToken, floristController.getFloristProfile);

// マッチングAI
router.post('/match-ai', authenticateToken, floristController.matchFloristsByAi);

// ==========================================
// お花屋さん検索・詳細
// ==========================================
router.get('/', floristController.getFlorists);

// 個別詳細 (動的パスは必ず静的パスより後に置くこと)
router.get('/:id', floristController.getFloristById);

// ==========================================
// 業務・プロフィール更新
// ==========================================
router.patch('/profile', authenticateToken, floristController.updateFloristProfile);
router.get('/schedule', authenticateToken, floristController.getSchedule);

// ==========================================
// ★ オファー・見積もり・出金
// ==========================================
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