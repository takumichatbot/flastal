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
router.patch('/notifications/read-all', authenticateToken, userController.markAllNotificationsRead);
router.patch('/notifications/:notificationId/read', authenticateToken, userController.markNotificationRead);

// ==========================================
// ★ ポイント履歴
// ==========================================
router.get('/points/history', authenticateToken, userController.getPointHistory);
// ポイント取引履歴（総合）
router.get('/point-history', authenticateToken, userController.getPointTransactionHistory);

// ==========================================
// ★ 支援受け取り確認
// ==========================================
router.patch('/pledges/:pledgeId/confirm-received', authenticateToken, userController.confirmPledgeReceived);

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

// ==========================================
// ★ フォロー関連
// ==========================================
router.post('/:userId/follow',    authenticateToken, userController.followUser);
router.delete('/:userId/follow',  authenticateToken, userController.unfollowUser);
router.get('/:userId/follow',     authenticateToken, userController.getFollowStatus);
router.get('/feed/following',     authenticateToken, userController.getFollowingFeed);

// ==========================================
// ★ KYC
// ==========================================
router.post('/kyc/submit', authenticateToken, userController.submitKyc);

// 紹介/アフィリエイト統計
router.get('/referral/stats', authenticateToken, userController.getReferralStats);

// ==========================================
// ★ 通知設定
// ==========================================
router.get('/notification-settings', authenticateToken, userController.getNotificationSettings);
router.put('/notification-settings', authenticateToken, userController.updateNotificationSettings);

// ==========================================
// ★ パスワード変更（ログイン中）
// ==========================================
router.post('/change-password', authenticateToken, userController.changePassword);

// ==========================================
// ★ メールアドレス変更フロー
// ==========================================
router.post('/request-email-change', authenticateToken, userController.requestEmailChange);
router.get('/confirm-email-change', userController.confirmEmailChange);

// ==========================================
// ★ バッジギャラリー
// ==========================================
router.get('/badges', authenticateToken, userController.getUserBadges);

// ==========================================
// ★ プッシュ通知デバイス管理
// ==========================================
router.get('/push-subscriptions', authenticateToken, userController.getPushSubscriptions);
router.delete('/push-subscriptions/:id', authenticateToken, userController.deletePushSubscription);

// ==========================================
// ★ アカウント削除 (Guideline 5.1.1(v))
// ==========================================
router.delete('/me', authenticateToken, userController.deleteMyAccount);

export default router;