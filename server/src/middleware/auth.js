import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

/**
 * ユーザー認証ミドルウェア
 * プロジェクト（projects.js）などのルートで使用されます
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

    // 1. JWTの検証（署名の確認）
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 2. 【ここが重要】トークン内の古い情報ではなく、DBから最新のユーザー情報を取得する
    const latestUser = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true } // 必要な項目だけ取得
    });

    if (!latestUser) {
      return res.status(404).json({ message: 'ユーザーが見つかりません。' });
    }

    // 3. 特別な救済措置：特定のメールアドレスを強制的にADMINとして認識させる
    if (latestUser.email === 'takuminsitou946@gmail.com') {
      latestUser.role = 'ADMIN';
    }

    // リクエストオブジェクトに最新のユーザー情報を格納
    req.user = latestUser;

    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error.name === 'TokenExpiredError' ? 'Token Expired' : error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'セッションの期限が切れました。再度ログインしてください。' });
    }
    return res.status(401).json({ message: '無効なトークンです。再度ログインしてください。' });
  }
};

/**
 * 管理者権限チェックミドルウェア
 * 管理者用ルート（admin.js）で使用されます
 */
export const requireAdmin = (req, res, next) => {
  // authenticateToken でDBから取得した最新の role をチェック
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    console.log(`Access Denied: User role is ${req.user?.role}`);
    res.status(403).json({ message: '管理者権限が必要です。' });
  }
};

/**
 * 旧名互換用のエイリアス（念のため）
 */
export const adminMiddleware = requireAdmin;