import express from 'express';
import * as userController from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// ==========================================
// プロフィール関連 ( /api/users... )
// ==========================================
// 公開プロフィール取得
router.get('/:id/profile', userController.getPublicProfile); 

// 自分のプロフィール更新 (複数のパスパターンに対応させて404を回避)
router.patch('/profile', authenticateToken, userController.updateProfile); 
router.patch('/:id', authenticateToken, userController.updateProfile); // ← 追加：/api/users/:id へのアクセス対応

// ==========================================
// プロジェクト取得関連 ( /api/users... )
// ==========================================
router.get('/:userId/projects', userController.getCreatedProjects); 
router.get('/:userId/created-projects', userController.getCreatedProjects);
router.get('/:userId/pledged-projects', userController.getPledgedProjects);
router.get('/:userId/offerable-projects', userController.getOfferableProjects);

// ==========================================
// ★ 通知関連
// ==========================================
router.get('/notifications', authenticateToken, userController.getNotifications);
router.patch('/notifications/:notificationId/read', authenticateToken, userController.markNotificationRead);

// ==========================================
// ★ 銀行口座関連
// ==========================================
router.get('/bank-accounts', authenticateToken, userController.getBankAccount);
router.post('/bank-accounts', authenticateToken, userController.registerBankAccount);

// ==========================================
// ★ ユーザー出金関連
// ==========================================
router.get('/payouts/history', authenticateToken, userController.getUserPayouts); 
router.post('/payouts/request', authenticateToken, userController.requestUserPayout);

export default router;