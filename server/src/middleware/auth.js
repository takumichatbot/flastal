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

    // 2. DBでの存在確認（ロールに応じて切り替え）
    let account = null;
    try {
        const condition = { id: userId };
        if (userRole === 'FLORIST') account = await prisma.florist.findUnique({ where: condition });
        else if (userRole === 'VENUE') account = await prisma.venue.findUnique({ where: condition });
        else if (userRole === 'ORGANIZER') account = await prisma.organizer.findUnique({ where: condition });
        else account = await prisma.user.findUnique({ where: condition });
    } catch (dbErr) {
        console.error('[Middleware] DB check failed:', dbErr.message);
    }

    // 3. リクエストオブジェクトの構築
    // DBに見つからない場合でも、トークンが有効ならログイン状態を維持させる
    req.user = {
        id: userId,
        email: account?.email || decoded.email,
        role: account?.role || userRole,
        status: account?.status || decoded.status || 'APPROVED',
        raw: account || decoded
    };

    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error.message);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'セッションが切れました。' });
    }
    return res.status(401).json({ message: '認証に失敗しました。' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') next();
  else res.status(403).json({ message: '管理者権限が必要です。' });
};

export const adminMiddleware = requireAdmin;