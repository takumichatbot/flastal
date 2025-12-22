import jwt from 'jsonwebtoken';

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

    // JWTの検証
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // リクエストオブジェクトにユーザー情報を格納
    req.user = decoded;

    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    return res.status(401).json({ message: '無効なトークンです。再度ログインしてください。' });
  }
};

/**
 * 管理者権限チェックミドルウェア
 * 管理者用ルート（admin.js）で使用されます
 */
export const requireAdmin = (req, res, next) => {
  // authenticateToken を通過した後に実行されることを想定
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ message: '管理者権限が必要です。' });
  }
};

/**
 * 旧名互換用のエイリアス（念のため）
 */
export const adminMiddleware = requireAdmin;