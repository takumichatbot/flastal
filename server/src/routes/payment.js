import express from 'express';
import * as paymentController from '../controllers/paymentController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate, pledgeSchema } from '../middleware/validate.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// ★ ゲストでもユーザーでも通すためのカスタムミドルウェア
const optionalAuthenticate = (req, _res, next) => {
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
router.post('/pledges', authenticateToken, validate(pledgeSchema), paymentController.createPledge);

// ポイントチャージの決済セッション
router.post('/checkout/create-session', authenticateToken, paymentController.createPointSession);

// ★ 新規: 統合チェックアウト (ハイブリッド決済 or ゲスト)
router.post('/checkout/create-checkout-session', optionalAuthenticate, paymentController.createCheckoutSession);

// ゲスト直接支援 (直接DB更新、必要に応じて残す)
router.post('/guest/pledges', paymentController.createGuestPledgeDirect);

// ポイント・支援の履歴取得
router.get('/history', authenticateToken, paymentController.getPaymentHistory);

// 領収書PDF
router.get('/pledges/:pledgeId/receipt', authenticateToken, paymentController.downloadReceipt);

// 適格請求書（インボイス）PDF
router.get('/pledges/:pledgeId/invoice', authenticateToken, paymentController.downloadInvoice);

// 月次サポーター Subscription チェックアウト
router.post('/checkout/subscription', authenticateToken, paymentController.createSubscriptionSession);

// 定期支援管理
router.get('/subscriptions/mine', authenticateToken, paymentController.getMySubscriptions);
router.delete('/subscriptions/:subscriptionId', authenticateToken, paymentController.cancelSubscription);

// プレミアムプラン
router.post('/premium/checkout', authenticateToken, paymentController.createPremiumSession);
router.delete('/premium/cancel',  authenticateToken, paymentController.cancelPremiumSubscription);

export default router;