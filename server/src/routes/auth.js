import express from 'express';
import * as authController from '../controllers/authController.js';

const router = express.Router();

// ==========================================
// 1. 一般ユーザー (User)
// ==========================================
router.post('/users/register', authController.registerUser);
router.post('/users/login', authController.loginUser);

// ==========================================
// 2. お花屋さん (Florist)
// ==========================================
router.post('/florists/register', authController.registerFlorist);
router.post('/florists/login', authController.loginFlorist);

// ==========================================
// 3. 会場 (Venue)
// ==========================================
router.post('/venues/register', authController.registerVenue);
router.post('/venues/login', authController.loginVenue);

// ==========================================
// 4. 主催者 (Organizer)
// ==========================================
router.post('/organizers/register', authController.registerOrganizer);
router.post('/organizers/login', authController.loginOrganizer);

// ==========================================
// 5. 共通認証機能 (Verify, Reset, etc.)
// ==========================================
// メール認証リンクの飛び先
router.post('/auth/verify', authController.verifyEmail);

// 認証メール再送信
router.post('/auth/resend-verification', authController.resendVerification);

// パスワード再設定リクエスト (メール送信)
router.post('/forgot-password', authController.forgotPassword);

// パスワードリセット実行 (新しいパスワード設定)
router.post('/reset-password', authController.resetPassword);

// ==========================================
// 6. 管理者 (Admin)
// ==========================================
router.post('/admin/login', authController.loginAdmin);

export default router;