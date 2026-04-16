import express from 'express';
import * as paymentController from '../controllers/paymentController.js';
import { authenticateToken } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// ★ ゲストでもユーザーでも通すためのカスタムミドルウェア
const optionalAuthenticate = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
        jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, user) => {
            if (!err) req.user = user;
            next();
        });
    } else {
        next();
    }
};

// 支援 (全額ポイント払い)
router.post('/pledges', authenticateToken, paymentController.createPledge);

// ポイントチャージの決済セッション
router.post('/checkout/create-session', authenticateToken, paymentController.createPointSession);

// ★ 新規: 統合チェックアウト (ハイブリッド決済 or ゲスト)
router.post('/checkout/create-checkout-session', optionalAuthenticate, paymentController.createCheckoutSession);

// ゲスト直接支援 (直接DB更新、必要に応じて残す)
router.post('/guest/pledges', paymentController.createGuestPledgeDirect);

// ポイント・支援の履歴取得
router.get('/history', authenticateToken, paymentController.getPaymentHistory);

export default router;