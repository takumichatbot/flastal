import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

/**
 * ユーザー認証ミドルウェア
 */
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('[Auth] No token provided');
      return res.status(401).json({ message: '認証トークンが必要です。' });
    }

    const token = authHeader.split(' ')[1].replace(/['"]+/g, '').trim();
    if (!token || token === 'null' || token === 'undefined') {
        return res.status(401).json({ message: 'トークンが不正です。' });
    }

    // 1. JWTの検証
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded.sub;
    let userRole = (decoded.role || 'USER').toUpperCase();

    // 2. 基本情報セット（rolesはJWT内の配列、なければroleから生成）
    const userRoles = Array.isArray(decoded.roles) ? decoded.roles : [userRole];
    req.user = {
        id: userId,
        email: decoded.email,
        role: userRole,
        roles: userRoles,
        status: decoded.status || 'APPROVED'
    };

    // 3. 停止ユーザーチェック（ロールに応じた正しいテーブルを参照）
    try {
        let dbRecord = null;
        if (userRole === 'FLORIST') {
            dbRecord = await prisma.florist.findUnique({ where: { id: userId }, select: { id: true, status: true } });
        } else if (userRole === 'VENUE') {
            dbRecord = await prisma.venue.findUnique({ where: { id: userId }, select: { id: true, status: true } });
        } else if (userRole === 'ORGANIZER') {
            dbRecord = await prisma.organizer.findUnique({ where: { id: userId }, select: { id: true, status: true } });
        } else {
            dbRecord = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, status: true } });
        }
        if (!dbRecord) {
            return res.status(401).json({ message: '認証に失敗しました。' });
        }
        if (dbRecord.status === 'SUSPENDED') {
            return res.status(403).json({ message: 'このアカウントは利用停止中です。' });
        }
    } catch (dbErr) {
        console.error('[Auth] Suspend check failed:', dbErr.message);
        // DB確認失敗時はフォールスルーして処理継続（可用性優先）
    }

    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error.message);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'expired', detail: 'セッションが切れました。再ログインしてください。' });
    }
    return res.status(401).json({ message: '認証に失敗しました。' });
  }
};

/**
 * 管理者権限チェック
 */
export const requireAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'ADMIN' || req.user.roles?.includes('ADMIN'))) {
      next();
  } else {
      res.status(403).json({ message: '管理者権限が必要です。' });
  }
};

export const adminMiddleware = requireAdmin;

// トークンがあればデコード、なくても通す（公開フィード用）
export const optionalAuth = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1].replace(/['"]+/g, '').trim();
      if (token && token !== 'null' && token !== 'undefined') {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { id: decoded.id || decoded.sub, email: decoded.email, role: (decoded.role || 'USER').toUpperCase() };
      }
    }
  } catch { /* ignore */ }
  next();
};