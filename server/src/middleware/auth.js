import jwt from 'jsonwebtoken';

/**
 * ユーザー認証ミドルウェア (authenticateToken という名前に合わせました)
 */
export const authenticateToken = async (req, res, next) => {
  try {
    // ヘッダーからトークンを取得
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '認証トークンが必要です。' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'トークンが不正です。' });
    }

    // JWTの検証 (JWT_SECRET は環境変数に設定されている必要があります)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // リクエストオブジェクトにユーザー情報を格納
    req.user = decoded;

    // 次の処理へ進む
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    return res.status(401).json({ message: '無効なトークンです。再度ログインしてください。' });
  }
};

/**
 * 管理者権限チェックミドルウェア
 */
export const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ message: '管理者権限が必要です。' });
  }
};