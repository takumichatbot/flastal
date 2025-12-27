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
// 5. 共通認証機能
// ==========================================
router.post('/auth/verify', authController.verifyEmail);
router.post('/auth/resend-verification', authController.resendVerification);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// ==========================================
// 6. 管理者 (Admin) 
// 【重要】ログインロジックを一般ユーザー用と分離
// ==========================================
router.post('/admin/login', authController.loginAdmin || authController.loginUser);

export default router;