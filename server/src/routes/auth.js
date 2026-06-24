import express from 'express';
import crypto from 'crypto';
import * as authController from '../controllers/authController.js';
import { validate, loginSchema, registerSchema } from '../middleware/validate.js';
import * as totpController from '../controllers/totpController.js';
import { authenticateToken } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
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
router.post('/auth/refresh', authController.refreshAccessToken);
router.post('/auth/logout', authController.revokeRefreshToken);
router.post('/auth/verify', authController.verifyEmail);
router.post('/auth/resend-verification', authController.resendVerification);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/reset-password', authLimiter, authController.resetPassword);

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
// ==========================================
// Apple Sign In (Capacitor ネイティブ)
// ==========================================
router.post('/auth/apple', async (req, res) => {
  const { identityToken, displayName } = req.body;
  const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://flastal.com';

  if (!identityToken) {
    return res.status(400).json({ message: 'identityToken が必要です' });
  }

  try {
    // Apple の公開鍵を取得して JWT を検証
    const keysRes = await fetch('https://appleid.apple.com/auth/keys');
    const { keys } = await keysRes.json();

    const [headerB64] = identityToken.split('.');
    const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString());

    const jwk = keys.find(k => k.kid === header.kid);
    if (!jwk) throw new Error('対応する Apple 公開鍵が見つかりません');

    const publicKey = crypto.createPublicKey({ key: jwk, format: 'jwk' });
    const pem = publicKey.export({ type: 'spki', format: 'pem' });

    const payload = jwt.verify(identityToken, pem, {
      algorithms: ['RS256'],
      issuer: 'https://appleid.apple.com',
    });

    const appleUserId = payload.sub;
    const email = payload.email
      ? payload.email.toLowerCase()
      : `apple_${appleUserId}@privaterelay.appleid.com`;

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { appleUserId },
          { email },
        ],
      },
    });

    if (!user) {
      const name = displayName || email.split('@')[0];
      user = await prisma.user.create({
        data: {
          email,
          handleName: name,
          appleUserId,
          isVerified: true,
          password: `apple_oauth_${appleUserId}`,
        },
      });
    } else if (!user.appleUserId) {
      // 既存ユーザーに appleUserId を紐付け
      user = await prisma.user.update({
        where: { id: user.id },
        data: { appleUserId },
      });
    }

    const { accessToken, refreshToken: appleRefreshToken } = await authController.generateTokensForOAuth({
      id: user.id, email: user.email, handleName: user.handleName, role: user.role, status: 'APPROVED',
    });

    res.json({ token: accessToken, refreshToken: appleRefreshToken, user: { id: user.id, email: user.email, handleName: user.handleName, role: user.role } });
  } catch (err) {
    console.error('Apple Sign In error:', err);
    res.status(401).json({ message: 'Apple 認証に失敗しました' });
  }
});

router.get('/auth/google', (req, res) => {
  // CSRF対策: stateトークンを生成してHttpOnly Cookieに保存（10分有効）
  const state = crypto.randomBytes(16).toString('hex');
  res.cookie('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000, // 10分
  });

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI || 'https://flastal-backend.onrender.com/api/auth/google/callback',
    response_type: 'code',
    scope: 'openid email profile',
    state,
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

router.get('/auth/google/callback', async (req, res) => {
  const { code, state } = req.query;
  const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://flastal.com';

  // CSRF検証: リクエストのstateとCookieのstateが一致するか確認
  const savedState = req.cookies?.oauth_state;
  if (!state || !savedState || state !== savedState) {
    return res.redirect(`${frontendUrl}/login?error=csrf_verification_failed`);
  }
  // 使用済みstateを削除
  res.clearCookie('oauth_state');

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

    const { accessToken, refreshToken: googleRefreshToken } = await authController.generateTokensForOAuth({
      id: user.id, email: user.email, handleName: user.handleName, role: user.role, status: 'APPROVED'
    });

    res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}&refreshToken=${googleRefreshToken}`);
  } catch (err) {
    console.error('Google OAuth error:', err);
    res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
  }
});

export default router;