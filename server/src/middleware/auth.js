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

    // トークンを取り出し、引用符や空白を完全に除去
    const token = authHeader.split(' ')[1].replace(/['"]+/g, '').trim();
    
    if (!token) {
      return res.status(401).json({ message: 'トークンが不正です。' });
    }

    // 1. JWTの検証
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // IDとEmailの抽出。確実にクリーンな状態にする
    const rawUserId = decoded.id || decoded.sub;
    const userEmail = decoded.email ? String(decoded.email).toLowerCase() : null;

    if (!rawUserId) {
        return res.status(401).json({ message: 'トークンに有効なIDが含まれていません。' });
    }
    const userId = String(rawUserId).replace(/['"]+/g, '');

    const userRoleInToken = decoded.role;

    // 2. 最新の情報をDBから取得
    let foundAccount = null;
    let finalRole = userRoleInToken || 'USER';
    const ADMIN_EMAILS = ["takuminsitou946@gmail.com", "hana87kaori@gmail.com"];

    // 役割に応じてテーブルを検索（IDで失敗した場合はEmailで検索するフォールバック付き）
    if (userRoleInToken === 'FLORIST') {
        foundAccount = await prisma.florist.findUnique({ where: { id: userId } });
        if (!foundAccount && userEmail) {
            foundAccount = await prisma.florist.findUnique({ where: { email: userEmail } });
        }
    } else if (userRoleInToken === 'VENUE') {
        foundAccount = await prisma.venue.findUnique({ where: { id: userId } });
        if (!foundAccount && userEmail) {
            foundAccount = await prisma.venue.findUnique({ where: { email: userEmail } });
        }
    } else if (userRoleInToken === 'ORGANIZER') {
        foundAccount = await prisma.organizer.findUnique({ where: { id: userId } });
        if (!foundAccount && userEmail) {
            foundAccount = await prisma.organizer.findUnique({ where: { email: userEmail } });
        }
    } else {
        foundAccount = await prisma.user.findUnique({ where: { id: userId } });
        if (!foundAccount && userEmail) {
            foundAccount = await prisma.user.findUnique({ where: { email: userEmail } });
        }
        finalRole = foundAccount?.role || 'USER';
    }

    if (!foundAccount) {
      console.error(`[AUTH ERROR] Account not found for ID: ${userId} or Email: ${userEmail}`);
      return res.status(404).json({ message: 'アカウントが見つかりません。再ログインしてください。' });
    }

    // 3. 管理者判定
    if (foundAccount.email && ADMIN_EMAILS.includes(foundAccount.email.toLowerCase())) {
        finalRole = 'ADMIN';
    }

    // リクエストオブジェクトに情報をセット（DB上の正式なデータを保持）
    req.user = {
        id: foundAccount.id,
        email: foundAccount.email.toLowerCase(),
        role: finalRole,
        status: foundAccount.status || 'APPROVED',
        data: foundAccount 
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

export const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ message: '管理者権限が必要です。' });
  }
};

export const adminMiddleware = requireAdmin;