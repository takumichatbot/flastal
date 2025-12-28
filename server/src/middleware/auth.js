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

    const token = authHeader.split(' ')[1].replace(/^["']|["']$/g, '').trim();
    if (!token) return res.status(401).json({ message: 'トークンが不正です。' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded.sub;
    const userRole = decoded.role;

    if (!userId) {
        return res.status(401).json({ message: 'トークンに有効なIDが含まれていません。' });
    }

    // 最新の情報をDBから取得 (Roleに応じたテーブルを検索)
    let foundUser = null;
    
    if (userRole === 'FLORIST') {
        foundUser = await prisma.florist.findUnique({ where: { id: userId }, select: { id: true, email: true, role: true } });
    } else if (userRole === 'VENUE') {
        foundUser = await prisma.venue.findUnique({ where: { id: userId }, select: { id: true, email: true, role: true } });
    } else if (userRole === 'ORGANIZER') {
        foundUser = await prisma.organizer.findUnique({ where: { id: userId }, select: { id: true, email: true, role: true } });
    } else {
        foundUser = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, role: true } });
    }

    if (!foundUser) {
      return res.status(404).json({ message: 'アカウントが見つかりません。' });
    }

    // 管理者救済ロジック
    const adminEmails = ["takuminsitou946@gmail.com", "hana87kaori@gmail.com"];
    if (adminEmails.includes(foundUser.email.toLowerCase())) {
        foundUser.role = 'ADMIN';
    }

    req.user = {
        id: foundUser.id,
        email: foundUser.email,
        role: foundUser.role || 'USER'
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