import express from 'express';
import * as floristController from '../controllers/floristController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// ==========================================
// お花屋さん検索・詳細 ( /api/florists... )
// ==========================================
router.get('/florists', floristController.getFlorists);
router.get('/florists/:id', floristController.getFloristById);
router.post('/florists/match-ai', authenticateToken, floristController.matchFloristsByAi);

// プロフィール・業務 ( /api/florists... )
router.patch('/florists/profile', authenticateToken, floristController.updateFloristProfile);
router.get('/florists/schedule', authenticateToken, floristController.getSchedule);

// ==========================================
// ★ オファー・見積もり ( /api/offers, /api/quotations )
// ==========================================
router.post('/offers', authenticateToken, floristController.createOffer);
router.patch('/offers/:offerId', authenticateToken, floristController.respondToOffer);
router.post('/quotations', authenticateToken, floristController.createQuotation);
router.patch('/quotations/:id/approve', authenticateToken, floristController.approveQuotation);
router.patch('/quotations/:id/finalize', authenticateToken, floristController.finalizeQuotation);

// ==========================================
// ★ 出金・売上 ( /api/florists/payouts... )
// ==========================================
router.get('/florists/payouts', authenticateToken, floristController.getPayouts); // 花屋専用履歴
// 花屋の申請も /api/payouts でしたが、ユーザーと競合するため、
// コントローラーで分岐するか、URLを分ける必要があります。
// 元のコード(index.js Line 1600)では `requestPayout` が `req.user.role` を見て処理していました。
// ここでは、ユーザー用とURLが被るため、一旦コメントアウトし、`users.js` 側の `/payouts` で
// ロール判定を入れて分岐させるのが正解ですが、
// 安全策として花屋用は `/api/florists/payouts/request` に逃がすか、
// `userController` の `requestUserPayout` 内でロール分岐を実装するのがベストです。
// ★今回は「花屋用」として明示的に分けます（フロントの修正が必要ないか確認推奨ですが、安全のため）
router.post('/florists/request-payout', authenticateToken, floristController.requestPayout); 

// ==========================================
// ★ 投稿・特売 ( /api/florists/posts, /api/deals )
// ==========================================
router.post('/florists/posts', authenticateToken, floristController.createFloristPost);
router.post('/florists/posts/:postId/like', authenticateToken, floristController.likeFloristPost);

router.post('/florists/deals', authenticateToken, floristController.createDeal);
router.get('/florists/deals', authenticateToken, floristController.getMyDeals);

// 特売検索 (公開) -> /api/deals/search
router.get('/deals/search', floristController.searchDeals);

export default router;