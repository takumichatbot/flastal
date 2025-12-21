import jwt from 'jsonwebtoken';

// JWT認証ミドルウェア
export const authenticateToken = (req, res, next, requiredRole = null) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: '認証トークンが必要です。' });
    }

    if (token === 'null' || token === 'undefined') {
        return res.status(401).json({ message: '無効なトークンです。再ログインしてください。' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'トークンが無効または期限切れです。' });
        }

        req.user = user;

        if (requiredRole && user.role !== requiredRole) {
            return res.status(403).json({ message: 'この操作を実行する権限がありません。' });
        }

        next();
    });
};

// 管理者権限チェック用ショートカット
export const requireAdmin = (req, res, next) => {
    authenticateToken(req, res, next, 'ADMIN');
};