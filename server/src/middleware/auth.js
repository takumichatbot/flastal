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

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'トークンが不正です。' });
    }

    // 1. JWTの検証
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded.id && !decoded.sub) {
        return res.status(401).json({ message: 'トークンにIDが含まれていません。' });
    }

    // 2. データベースから最新のユーザー情報を取得（roleを確実に取得）
    const userId = decoded.id || decoded.sub;
    const latestUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true }
    });

    if (!latestUser) {
      return res.status(404).json({ message: 'ユーザーが見つかりません。' });
    }

    // 3. 【救済ロジック】メールアドレスが一致すれば強制的にロールをセット
    const adminEmails = ["takuminsitou946@gmail.com", "hana87kaori@gmail.com"];
    if (adminEmails.includes(latestUser.email.toLowerCase())) {
        latestUser.role = 'ADMIN';
    }

    // リクエストオブジェクトに格納（ここが undefined だと requireAdmin で落ちる）
    req.user = {
        id: latestUser.id,
        email: latestUser.email,
        role: latestUser.role || 'USER'
    };

    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error.name === 'TokenExpiredError' ? 'Expired' : error.message);
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
    // ログに出力して原因を追跡しやすくする
    console.error(`[Access Denied] User: ${req.user?.email}, Role: ${req.user?.role}`);
    res.status(403).json({ message: '管理者権限が必要です。' });
  }
};

export const adminMiddleware = requireAdmin;