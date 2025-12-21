import express from 'express';
import * as paymentController from '../controllers/paymentController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 支援 (ポイント払い)
router.post('/pledges', authenticateToken, paymentController.createPledge);

// 決済セッション
router.post('/checkout/create-session', authenticateToken, paymentController.createPointSession);
router.post('/checkout/create-guest-session', paymentController.createGuestSession); // 認証不要


// ★ 追加: ゲスト直接支援 (認証不要)
router.post('/guest/pledges', paymentController.createGuestPledgeDirect);


export default router;