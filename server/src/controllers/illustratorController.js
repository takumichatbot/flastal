import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendDynamicEmail } from '../utils/email.js';

// --- 登録 ---
export const registerIllustrator = async (req, res) => {
  try {
    const { email, password, activityName } = req.body;
    const lowerEmail = email.toLowerCase();

    // 重複チェック
    const existing = await prisma.illustrator.findUnique({ where: { email: lowerEmail } });
    if (existing) return res.status(409).json({ message: 'このメールアドレスは既に使用されています。' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = require('crypto').randomBytes(32).toString('hex');

    await prisma.illustrator.create({
      data: {
        email: lowerEmail,
        password: hashedPassword,
        activityName,
        verificationToken,
        status: 'PENDING'
      }
    });

    // 確認メール送信
    const verificationUrl = `${process.env.FRONTEND_URL}/verify?token=${verificationToken}`;
    await sendDynamicEmail(lowerEmail, 'VERIFICATION_EMAIL', { userName: activityName, verificationUrl });

    res.status(201).json({ message: '登録を受け付けました。確認メールを送信しました。' });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: '登録処理に失敗しました。' });
  }
};

// --- ログイン ---
export const loginIllustrator = async (req, res) => {
  try {
    const { email, password } = req.body;
    const lowerEmail = email.toLowerCase();

    const illustrator = await prisma.illustrator.findUnique({ where: { email: lowerEmail } });
    if (!illustrator) return res.status(401).json({ message: 'メールアドレスまたはパスワードが間違っています。' });

    const isMatch = await bcrypt.compare(password, illustrator.password);
    if (!isMatch) return res.status(401).json({ message: 'メールアドレスまたはパスワードが間違っています。' });

    if (!illustrator.isVerified) return res.status(403).json({ message: 'メール認証が完了していません。' });
    if (illustrator.status !== 'APPROVED') return res.status(403).json({ message: 'アカウントの審査が完了していません。' });

    const token = jwt.sign(
      { 
        id: illustrator.id, 
        email: illustrator.email, 
        role: 'ILLUSTRATOR', 
        status: illustrator.status,
        handleName: illustrator.activityName 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...cleanData } = illustrator;
    res.json({ token, illustrator: cleanData });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: 'ログイン処理に失敗しました。' });
  }
};

// --- プロフィール取得 ---
export const getIllustratorProfile = async (req, res) => {
  try {
    const illustrator = await prisma.illustrator.findUnique({ 
      where: { id: req.user.id } 
    });
    if (!illustrator) return res.status(404).json({ message: 'データが見つかりません' });
    
    const { password, ...cleanData } = illustrator;
    res.json(cleanData);
  } catch (error) {
    res.status(500).json({ message: '取得に失敗しました' });
  }
};

// --- ダッシュボード情報取得 ---
export const getDashboardData = async (req, res) => {
  try {
    // 将来的には案件数などを集計して返す
    // 現状はモックデータを返すか、空の状態を返す
    res.json({
        activeOrders: 0,
        completedOrders: 0,
        salesBalance: 0
    });
  } catch (error) {
    res.status(500).json({ message: 'データ取得エラー' });
  }
};