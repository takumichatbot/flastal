// src/controllers/illustratorController.js
import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendDynamicEmail } from '../utils/email.js';

// ==========================================
// 🎨 絵師の登録・ログイン (Userテーブル統合版)
// ==========================================

export const registerIllustrator = async (req, res) => {
  try {
    const { email, password, activityName } = req.body;
    const lowerEmail = email.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email: lowerEmail } });
    if (existing) return res.status(409).json({ message: 'このメールアドレスは既に使用されています。' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const newUser = await prisma.user.create({
      data: {
        email: lowerEmail,
        password: hashedPassword,
        handleName: activityName,
        role: 'ILLUSTRATOR',
        verificationToken,
        status: 'PENDING', 
      }
    });

    const verificationUrl = `${process.env.FRONTEND_URL}/verify?token=${verificationToken}`;
    await sendDynamicEmail(lowerEmail, 'VERIFICATION_EMAIL', { userName: activityName, verificationUrl });

    res.status(201).json({ message: '登録を受け付けました。確認メールを送信しました。' });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: '登録処理に失敗しました。' });
  }
};

export const loginIllustrator = async (req, res) => {
  try {
    const { email, password } = req.body;
    const lowerEmail = email.toLowerCase();

    const user = await prisma.user.findUnique({ where: { email: lowerEmail } });
    if (!user || user.role !== 'ILLUSTRATOR') {
        return res.status(401).json({ message: 'メールアドレスまたはパスワードが間違っています。' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'メールアドレスまたはパスワードが間違っています。' });

    if (!user.isVerified) return res.status(403).json({ message: 'メール認証が完了していません。' });
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, status: user.status },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...cleanData } = user;
    res.json({ token, illustrator: cleanData });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: 'ログイン処理に失敗しました。' });
  }
};

// ==========================================
// 🎨 プロフィール関連
// ==========================================

export const getIllustratorsList = async (req, res) => {
    try {
        const profiles = await prisma.illustratorProfile.findMany({
            where: {
                isAcceptingRequests: true,
                user: { status: 'APPROVED' }
            },
            include: {
                user: { select: { handleName: true, iconUrl: true, id: true } }
            },
            orderBy: { updatedAt: 'desc' }
        });

        const formatted = profiles.map(p => ({
            id: p.id,
            userId: p.userId,
            name: p.user.handleName,
            iconUrl: p.user.iconUrl,
            bio: p.bio,
            basePrice: p.basePrice,
            deliveryDays: p.deliveryDays,
            tags: p.tags,
            portfolioUrls: p.portfolioUrls,
            isAcceptingRequests: p.isAcceptingRequests
        }));

        res.json(formatted);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'クリエイター一覧の取得に失敗しました。' });
    }
};

export const getIllustratorDetail = async (req, res) => {
    try {
        const { id } = req.params; 
        const profile = await prisma.illustratorProfile.findUnique({
            where: { userId: id },
            include: { user: { select: { handleName: true, iconUrl: true } } }
        });

        if (!profile) return res.status(404).json({ message: 'クリエイターが見つかりません。' });

        res.json({
            ...profile,
            name: profile.user.handleName,
            iconUrl: profile.user.iconUrl
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '詳細の取得に失敗しました。' });
    }
};

export const getMyProfile = async (req, res) => {
    try {
        const profile = await prisma.illustratorProfile.findUnique({
            where: { userId: req.user.id }
        });
        if (!profile) return res.status(404).json({ message: 'プロフィール未設定' });
        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: 'プロフィールの取得に失敗しました。' });
    }
};

export const updateMyProfile = async (req, res) => {
    try {
        const { bio, socialLink, basePrice, deliveryDays, retakeCount, isAcceptingRequests, tags, portfolioUrls } = req.body;

        const profile = await prisma.illustratorProfile.upsert({
            where: { userId: req.user.id },
            update: {
                bio, socialLink, basePrice, deliveryDays, retakeCount, isAcceptingRequests, tags, portfolioUrls
            },
            create: {
                userId: req.user.id,
                bio, socialLink, basePrice, deliveryDays, retakeCount, isAcceptingRequests, tags, portfolioUrls
            }
        });

        res.json(profile);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'プロフィールの更新に失敗しました。' });
    }
};


// ==========================================
// 🎨 ダッシュボード関連
// ==========================================

export const getDashboardStats = async (req, res) => {
    try {
        const activeOrders = await prisma.project.count({
            where: { 
                illustratorId: req.user.id,
                status: { notIn: ['COMPLETED', 'CANCELED'] }
            }
        });

        const completedOrders = await prisma.project.count({
            where: { 
                illustratorId: req.user.id,
                status: 'COMPLETED'
            }
        });

        res.json({ activeOrders, completedOrders });
    } catch (error) {
        res.status(500).json({ message: '統計の取得に失敗しました。' });
    }
};

export const getMyActiveProjects = async (req, res) => {
    try {
        const projects = await prisma.project.findMany({
            where: { 
                illustratorId: req.user.id,
                status: { notIn: ['COMPLETED', 'CANCELED'] }
            },
            orderBy: { deliveryDateTime: 'asc' }
        });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: '進行中の案件の取得に失敗しました。' });
    }
};


// ==========================================
// 🎨 オファー(指名依頼)関連
// ==========================================

export const getMyOffers = async (req, res) => {
    try {
        const offers = await prisma.illustratorOffer.findMany({
            where: { illustratorId: req.user.id, status: 'PENDING' },
            include: {
                project: { select: { title: true, planner: { select: { handleName: true } } } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(offers);
    } catch (error) {
        res.status(500).json({ message: 'オファーの取得に失敗しました。' });
    }
};

export const sendOffer = async (req, res) => {
    try {
        const { projectId, illustratorId, amount, message } = req.body;
        
        const planner = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (planner.points < amount) return res.status(400).json({ message: 'ポイントが不足しています。' });

        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (project.plannerId !== req.user.id) return res.status(403).json({ message: '権限がありません。' });

        const offer = await prisma.illustratorOffer.create({
            data: { projectId, illustratorId, amount, message }
        });

        res.status(201).json(offer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'オファーの送信に失敗しました。' });
    }
};

export const acceptOffer = async (req, res) => {
    try {
        const { id } = req.params;
        const offer = await prisma.illustratorOffer.findUnique({ 
            where: { id }, include: { project: true } 
        });

        if (!offer || offer.illustratorId !== req.user.id) return res.status(403).json({ message: '権限がありません。' });
        if (offer.status !== 'PENDING') return res.status(400).json({ message: 'このオファーは既に処理されています。' });

        await prisma.$transaction(async (tx) => {
            const planner = await tx.user.findUnique({ where: { id: offer.project.plannerId } });
            if (planner.points < offer.amount) throw new Error('企画者のポイントが不足しているため、受注できませんでした。');

            // 1. オファーを承認済みに
            await tx.illustratorOffer.update({ where: { id }, data: { status: 'ACCEPTED' } });
            
            // 2. プロジェクトに絵師をセットし、報酬額を記録
            await tx.project.update({
                where: { id: offer.projectId },
                data: { illustratorId: req.user.id, illustratorReward: offer.amount }
            });

            // 3. 企画者のポイントを減らす (仮払い)
            await tx.user.update({
                where: { id: planner.id },
                data: { points: { decrement: offer.amount } }
            });
        });

        res.json({ message: '受注しました！' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || '受注処理に失敗しました。' });
    }
};

export const rejectOffer = async (req, res) => {
    try {
        const { id } = req.params;
        const offer = await prisma.illustratorOffer.findUnique({ where: { id } });
        if (!offer || offer.illustratorId !== req.user.id) return res.status(403).json({ message: '権限がありません。' });

        await prisma.illustratorOffer.update({
            where: { id },
            data: { status: 'REJECTED' }
        });
        res.json({ message: '辞退しました。' });
    } catch (error) {
        res.status(500).json({ message: '辞退処理に失敗しました。' });
    }
};


// ==========================================
// 🎨 立候補(公募への応募)関連
// ==========================================

export const getMyApplications = async (req, res) => {
    try {
        const apps = await prisma.illustratorApplication.findMany({
            where: { illustratorId: req.user.id },
            include: { project: { select: { id: true, title: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(apps);
    } catch (error) {
        res.status(500).json({ message: '履歴の取得に失敗しました。' });
    }
};

export const applyForRecruitment = async (req, res) => {
    try {
        // フロントから送られてくる eventId は、実際には projectId である想定
        const { eventId, proposedAmount, message } = req.body;
        
        const application = await prisma.illustratorApplication.create({
            data: {
                projectId: eventId, 
                illustratorId: req.user.id,
                proposedAmount: Number(proposedAmount),
                message
            }
        });
        res.status(201).json(application);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '立候補の送信に失敗しました。' });
    }
};