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

    // 2. 基本情報セット
    req.user = {
        id: userId,
        email: decoded.email,
        role: userRole,
        status: decoded.status || 'APPROVED'
    };

    // 3. 権限補完ロジック (会場/花屋/主催者)
    try {
        const venueAccount = await prisma.venue.findUnique({ where: { id: userId } });
        if (venueAccount) {
            req.user.role = 'VENUE';
            req.user.status = venueAccount.status;
            req.user.raw = venueAccount;
        } else if (userRole === 'FLORIST') {
            const floristAccount = await prisma.florist.findUnique({ where: { id: userId } });
            if (floristAccount) req.user.raw = floristAccount;
        } else if (userRole === 'ORGANIZER') {
            const organizerAccount = await prisma.organizer.findUnique({ where: { id: userId } });
            if (organizerAccount) req.user.raw = organizerAccount;
        }
    } catch (dbErr) {
        console.error('[Middleware] DB check failed:', dbErr.message);
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
  if (req.user && req.user.role === 'ADMIN') {
      next();
  } else {
      res.status(403).json({ message: '管理者権限が必要です。' });
  }
};

export const adminMiddleware = requireAdmin;