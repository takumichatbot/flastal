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

    // トークンを取り出し、前後の引用符や空白を完全に除去
    const token = authHeader.split(' ')[1].replace(/['"]+/g, '').trim();
    
    if (!token) {
      return res.status(401).json({ message: 'トークンが不正です。' });
    }

    // 1. JWTの検証
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // IDの抽出 (id または sub)
    const userId = decoded.id || decoded.sub;
    const userRoleInToken = decoded.role; // トークン作成時に付与したRole

    if (!userId) {
        console.error('Auth Error: No userId in token payload');
        return res.status(401).json({ message: 'トークンに有効なIDが含まれていません。' });
    }

    // 2. 最新の情報をDBから取得
    let foundAccount = null;
    let finalRole = userRoleInToken || 'USER';
    const ADMIN_EMAILS = ["takuminsitou946@gmail.com", "hana87kaori@gmail.com"];

    // 文字列としてクリーンなIDで検索
    const cleanId = String(userId);

    if (userRoleInToken === 'FLORIST') {
        foundAccount = await prisma.florist.findUnique({ where: { id: cleanId }, select: { id: true, email: true } });
    } else if (userRoleInToken === 'VENUE') {
        foundAccount = await prisma.venue.findUnique({ where: { id: cleanId }, select: { id: true, email: true } });
    } else if (userRoleInToken === 'ORGANIZER') {
        foundAccount = await prisma.organizer.findUnique({ where: { id: cleanId }, select: { id: true, email: true } });
    } else {
        foundAccount = await prisma.user.findUnique({ where: { id: cleanId }, select: { id: true, email: true, role: true } });
        finalRole = foundAccount?.role || 'USER';
    }

    if (!foundAccount) {
      console.error(`Auth Error: Account not found in DB for ID: ${cleanId}`);
      return res.status(404).json({ message: 'アカウントが見つかりません。再ログインしてください。' });
    }

    // 3. 管理者救済・確定ロジック
    if (foundAccount.email && ADMIN_EMAILS.includes(foundAccount.email.toLowerCase())) {
        finalRole = 'ADMIN';
    }

    // リクエストオブジェクトに情報をセット
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
    res.status(403).json({ message: '管理者権限が必要です。' });
  }
};

export const adminMiddleware = requireAdmin;