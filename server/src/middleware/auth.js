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

    const token = authHeader.split(' ')[1].replace(/['"]+/g, '').trim();
    if (!token) return res.status(401).json({ message: 'トークンが不正です。' });

    // 1. JWTの検証
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) return res.status(401).json({ message: 'トークンの解析に失敗しました。' });
    
    const userId = decoded.id || decoded.sub;
    const userRole = decoded.role || 'USER';

    // 2. リクエストオブジェクトの構築
    // DBへのアクセスを最小限にし、トークン内の情報を優先する
    req.user = {
        id: userId,
        email: decoded.email,
        role: userRole,
        status: decoded.status || 'APPROVED'
    };

    // 3. 非同期でDB情報の確認が必要な場合のみ試行（クラッシュ防止）
    if (userRole !== 'USER' && userRole !== 'ADMIN') {
        try {
            let account = null;
            if (userRole === 'FLORIST') account = await prisma.florist.findUnique({ where: { id: userId } });
            else if (userRole === 'VENUE') account = await prisma.venue.findUnique({ where: { id: userId } });
            else if (userRole === 'ORGANIZER') account = await prisma.organizer.findUnique({ where: { id: userId } });
            
            if (account) {
                req.user.status = account.status;
                req.user.raw = account;
            }
        } catch (dbErr) {
            console.error('[Middleware] DB check failed:', dbErr.message);
        }
    }

    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error.message);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'セッションが切れました。再ログインしてください。' });
    }
    return res.status(401).json({ message: '認証に失敗しました。' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
      next();
  } else {
      res.status(403).json({ message: '管理者権限が必要です。' });
  }
};

export const adminMiddleware = requireAdmin;