import express from 'express';
import * as authController from '../controllers/authController.js';
import { validate, loginSchema, registerSchema } from '../middleware/validate.js';
import * as totpController from '../controllers/totpController.js';
import { authenticateToken } from '../middleware/auth.js';
import prisma from '../config/prisma.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// ==========================================
// 1. 一般ユーザー (User)
// ==========================================
router.post('/users/register', validate(registerSchema), authController.registerUser);
router.post('/users/login', validate(loginSchema), authController.loginUser);

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

// ==========================================
// 7. 2FA (TOTP)
// ==========================================
router.post('/auth/totp/setup',   authenticateToken, totpController.setupTotp);
router.post('/auth/totp/verify',  authenticateToken, totpController.verifyTotp);
router.post('/auth/totp/disable', authenticateToken, totpController.disableTotp);

// ==========================================
// 8. Google OAuth
// ==========================================
router.get('/auth/google', (req, res) => {
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${process.env.GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.GOOGLE_REDIRECT_URI || 'https://flastal-backend.onrender.com/api/auth/google/callback')}` +
    `&response_type=code` +
    `&scope=openid%20email%20profile`;
  res.redirect(googleAuthUrl);
});

router.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://flastal.com';

  try {
    // code でアクセストークン取得
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI || 'https://flastal-backend.onrender.com/api/auth/google/callback',
        grant_type: 'authorization_code',
      }),
    });
    const tokens = await tokenRes.json();

    if (!tokens.access_token) {
      throw new Error('アクセストークンの取得に失敗しました');
    }

    // ユーザー情報取得
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const googleUser = await userInfoRes.json();

    if (!googleUser.email) {
      throw new Error('Googleアカウントからメールアドレスを取得できませんでした');
    }

    const lowerEmail = googleUser.email.toLowerCase();

    // DBにユーザー作成または取得
    // ※ User モデルに provider/providerId フィールドがないため email で検索
    let user = await prisma.user.findUnique({ where: { email: lowerEmail } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: lowerEmail,
          handleName: googleUser.name || lowerEmail.split('@')[0],
          iconUrl: googleUser.picture || null,
          isVerified: true,
          // OAuth ユーザーはパスワード不要だが schema 上 required のためランダム文字列をセット
          password: `google_oauth_${googleUser.sub}`,
        },
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, handleName: user.handleName, role: user.role, status: 'APPROVED' },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // フロントエンドにリダイレクト（token を URL で渡す）
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  } catch (err) {
    console.error('Google OAuth error:', err);
    res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
  }
});

export default router;