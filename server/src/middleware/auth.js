import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

/**
 * ユーザー認証ミドルウェア
 */
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '認証トークンが必要です。' });
    }

    const token = authHeader.split(' ')[1].replace(/^["']|["']$/g, '').trim();
    if (!token) return res.status(401).json({ message: 'トークンが不正です。' });

    // 1. JWTの検証
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded.sub;
    const userRoleInToken = decoded.role; // トークンに記録されているRole

    if (!userId) {
        return res.status(401).json({ message: 'トークンに有効なIDが含まれていません。' });
    }

    // 2. 最新の情報をDBから取得
    // ★ 修正ポイント: role はテーブルに存在しない場合があるため select から除外
    let foundAccount = null;
    let finalRole = 'USER';
    const ADMIN_EMAILS = ["takuminsitou946@gmail.com", "hana87kaori@gmail.com"];

    if (userRoleInToken === 'FLORIST') {
        foundAccount = await prisma.florist.findUnique({ where: { id: userId }, select: { id: true, email: true } });
        finalRole = 'FLORIST';
    } else if (userRoleInToken === 'VENUE') {
        foundAccount = await prisma.venue.findUnique({ where: { id: userId }, select: { id: true, email: true } });
        finalRole = 'VENUE';
    } else if (userRoleInToken === 'ORGANIZER') {
        foundAccount = await prisma.organizer.findUnique({ where: { id: userId }, select: { id: true, email: true } });
        finalRole = 'ORGANIZER';
    } else {
        foundAccount = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, role: true } });
        finalRole = foundAccount?.role || 'USER';
    }

    if (!foundAccount) {
      return res.status(404).json({ message: 'アカウントが見つかりません。' });
    }

    // 3. 管理者救済・確定ロジック (最優先)
    if (ADMIN_EMAILS.includes(foundAccount.email.toLowerCase())) {
        finalRole = 'ADMIN';
    }

    // リクエストオブジェクトに情報を確実にセット
    req.user = {
        id: foundAccount.id,
        email: foundAccount.email.toLowerCase(),
        role: finalRole
    };

    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error.message);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'セッションが切れました。再ログインしてください。' });
    }
    return res.status(401).json({ message: '無効なトークンです。' });
  }
};

/**
 * 管理者権限チェックミドルウェア
 */
export const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ message: 'この操作には管理者権限が必要です。' });
  }
};

export const adminMiddleware = requireAdmin;