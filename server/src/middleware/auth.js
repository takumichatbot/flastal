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
    
    // トークンから識別情報を抽出
    const userEmail = decoded.email ? String(decoded.email).toLowerCase().trim() : null;
    const rawUserId = decoded.id || decoded.sub;
    const userId = rawUserId ? String(rawUserId).replace(/['"]+/g, '').trim() : null;

    if (!userEmail && !userId) {
        return res.status(401).json({ message: 'トークンに有効な識別情報が含まれていません。' });
    }

    const userRoleInToken = decoded.role;

    // 2. 最新の情報をDBから取得を試みる
    let foundAccount = null;
    let finalRole = userRoleInToken || 'USER';
    const ADMIN_EMAILS = ["takuminsitou946@gmail.com", "hana87kaori@gmail.com"];

    try {
        const searchCondition = userEmail ? { email: userEmail } : { id: userId };

        if (userRoleInToken === 'FLORIST') {
            foundAccount = await prisma.florist.findUnique({ where: searchCondition });
        } else if (userRoleInToken === 'VENUE') {
            foundAccount = await prisma.venue.findUnique({ where: searchCondition });
        } else if (userRoleInToken === 'ORGANIZER') {
            foundAccount = await prisma.organizer.findUnique({ where: searchCondition });
        } else {
            foundAccount = await prisma.user.findUnique({ where: searchCondition });
            finalRole = foundAccount?.role || 'USER';
        }
    } catch (dbError) {
        console.error('[AUTH DB ERROR]', dbError.message);
        // DB検索に失敗しても、トークンが有効なら decoded を信じて次へ進む（救済措置）
    }

    // 3. 管理者判定
    const emailForAdmin = (foundAccount?.email || userEmail || "").toLowerCase();
    if (ADMIN_EMAILS.includes(emailForAdmin)) {
        finalRole = 'ADMIN';
    }

    // リクエストオブジェクトに情報をセット
    // DBに見つからない場合でも decoded の情報を保持させる
    req.user = {
        id: foundAccount?.id || userId,
        email: emailForAdmin,
        role: finalRole,
        status: foundAccount?.status || decoded.status || 'APPROVED',
        // 生のデータをバックアップとして保持
        raw: foundAccount || decoded 
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