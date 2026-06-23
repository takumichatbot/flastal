import express from 'express';
import * as shopController from '../controllers/shopController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// 花屋であることを確認するミドルウェア
const requireFlorist = (req, res, next) => {
  if (req.user?.role === 'FLORIST') return next();
  res.status(403).json({ message: '花屋アカウントが必要です。' });
};

// ─── 公開API（商品閲覧） ───────────────────────────────
router.get('/categories', shopController.getCategories);
router.get('/products', shopController.getProducts);
router.get('/products/:id', shopController.getProduct);

// ─── 花屋向けAPI（カート・注文） ──────────────────────────
router.get('/cart', authenticateToken, requireFlorist, shopController.getCart);
router.post('/cart', authenticateToken, requireFlorist, shopController.upsertCartItem);
router.put('/cart', authenticateToken, requireFlorist, shopController.upsertCartItem);
router.delete('/cart/:productId', authenticateToken, requireFlorist, shopController.removeCartItem);
router.post('/checkout', authenticateToken, requireFlorist, shopController.createCheckoutSession);
router.get('/orders', authenticateToken, requireFlorist, shopController.getMyOrders);
router.get('/orders/:id', authenticateToken, requireFlorist, shopController.getMyOrder);

// ─── 花屋向けAPI（定期購入） ──────────────────────────────
router.get('/subscriptions', authenticateToken, requireFlorist, shopController.getSubscriptions);
router.post('/subscriptions', authenticateToken, requireFlorist, shopController.createSubscription);
router.delete('/subscriptions/:id', authenticateToken, requireFlorist, shopController.cancelSubscription);

// ─── 管理者API ─────────────────────────────────────────
router.get('/admin/products', authenticateToken, requireAdmin, shopController.adminGetProducts);
router.post('/admin/products', authenticateToken, requireAdmin, shopController.adminCreateProduct);
router.put('/admin/products/:id', authenticateToken, requireAdmin, shopController.adminUpdateProduct);
router.delete('/admin/products/:id', authenticateToken, requireAdmin, shopController.adminDeleteProduct);
router.post('/admin/categories', authenticateToken, requireAdmin, shopController.adminCreateCategory);
router.get('/admin/orders', authenticateToken, requireAdmin, shopController.adminGetOrders);
router.patch('/admin/orders/:id/status', authenticateToken, requireAdmin, shopController.adminUpdateOrderStatus);

export default router;
