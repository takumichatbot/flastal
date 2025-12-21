import express from 'express';
import * as userController from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// ==========================================
// プロフィール関連 ( /api/users... )
// ==========================================
router.get('/users/:id/profile', userController.getPublicProfile); // 公開プロフィール
router.patch('/users/profile', authenticateToken, userController.updateProfile); // 自分の更新

// ==========================================
// プロジェクト取得関連 ( /api/users... )
// ==========================================
router.get('/users/:userId/projects', userController.getCreatedProjects); // 互換性のため
router.get('/users/:userId/created-projects', userController.getCreatedProjects);
router.get('/users/:userId/pledged-projects', userController.getPledgedProjects);
router.get('/users/:userId/offerable-projects', userController.getOfferableProjects);

// ==========================================
// ★ 通知関連 ( /api/notifications... )
// ==========================================
// ※ 元のindex.jsに合わせて /api/users 配下ではなくルート直下にします
router.get('/notifications', authenticateToken, userController.getNotifications);
router.patch('/notifications/:notificationId/read', authenticateToken, userController.markNotificationRead);

// ==========================================
// ★ 銀行口座関連 ( /api/bank-accounts... )
// ==========================================
router.get('/bank-accounts', authenticateToken, userController.getBankAccount);
router.post('/bank-accounts', authenticateToken, userController.registerBankAccount);

// ==========================================
// ★ ユーザー出金関連 ( /api/payouts... )
// ==========================================
// ※ UserとFloristでURLが重複しないよう注意が必要ですが、
// 元コードではユーザー出金と花屋出金申請が混在していました。
// ユーザー出金履歴
router.get('/users/payouts', authenticateToken, userController.getUserPayouts); 
// ※元コードのユーザー出金申請は /api/payouts でした
router.post('/payouts', authenticateToken, userController.requestUserPayout);

export default router;