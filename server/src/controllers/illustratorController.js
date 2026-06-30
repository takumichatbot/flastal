// src/controllers/illustratorController.js
import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendDynamicEmail } from '../utils/email.js';
import { logger } from '../utils/logger.js';

// ==========================================
// 🎨 絵師の登録・ログイン (Userテーブル統合版)
// ==========================================

export const registerIllustrator = async (req, res) => {
  try {
    const { email, password, activityName } = req.body;
    const lowerEmail = email.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email: lowerEmail } });
    if (existing) {
      if (existing.role === 'ILLUSTRATOR' && !existing.isVerified) {
        // 未認証のイラストレーターアカウントが既存 → 認証メールを再送
        const newToken = crypto.randomBytes(32).toString('hex');
        await prisma.user.update({ where: { id: existing.id }, data: { verificationToken: newToken } });
        const verificationUrl = `${process.env.FRONTEND_URL}/verify?token=${newToken}`;
        await sendDynamicEmail({ to: lowerEmail, templateType: 'VERIFICATION', dynamicData: { verificationUrl } });
        return res.status(409).json({ message: 'このメールアドレスは登録済みですが未認証です。確認メールを再送しました。受信箱をご確認ください。' });
      }
      if (existing.role !== 'ILLUSTRATOR') {
        return res.status(409).json({ message: 'このメールアドレスは別のアカウント（一般ユーザー等）で使用されています。別のメールアドレスをご使用ください。' });
      }
      return res.status(409).json({ message: 'このメールアドレスは既に使用されています。' });
    }

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
    logger.error('Register Error', { context: 'illustratorController', error: error.message });
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
    // refreshTokenにもtokenを使い、/auth/refreshでセッション維持
    res.json({ token, refreshToken: token, illustrator: cleanData });
  } catch (error) {
    logger.error('Login Error', { context: 'illustratorController', error: error.message });
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
        logger.error('クリエイター一覧の取得に失敗しました', { context: 'illustratorController', error: error.message });
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
        logger.error('詳細の取得に失敗しました', { context: 'illustratorController', error: error.message });
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

        if (basePrice !== undefined) {
            const price = parseInt(basePrice);
            if (isNaN(price) || price < 0 || price > 10000000) {
                return res.status(400).json({ message: '基本料金は0〜10,000,000円の範囲で指定してください。' });
            }
        }
        if (deliveryDays !== undefined) {
            const days = parseInt(deliveryDays);
            if (isNaN(days) || days < 1 || days > 365) {
                return res.status(400).json({ message: '納期は1〜365日の範囲で指定してください。' });
            }
        }
        if (bio && bio.length > 1000) {
            return res.status(400).json({ message: '自己紹介は1000文字以内で入力してください。' });
        }

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
        logger.error('プロフィールの更新に失敗しました', { context: 'illustratorController', error: error.message });
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

        if (!projectId || !illustratorId) {
            return res.status(400).json({ message: 'プロジェクトとイラストレーターの指定は必須です。' });
        }
        const parsedAmount = parseInt(amount);
        if (isNaN(parsedAmount) || parsedAmount < 1 || parsedAmount > 10000000) {
            return res.status(400).json({ message: '金額は1〜10,000,000円の範囲で指定してください。' });
        }
        if (message && message.length > 2000) {
            return res.status(400).json({ message: 'メッセージは2000文字以内で入力してください。' });
        }

        const planner = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (planner.points < amount) return res.status(400).json({ message: 'ポイントが不足しています。' });

        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (project.plannerId !== req.user.id) return res.status(403).json({ message: '権限がありません。' });

        const offer = await prisma.illustratorOffer.create({
            data: { projectId, illustratorId, amount, message }
        });

        res.status(201).json(offer);
    } catch (error) {
        logger.error('オファーの送信に失敗しました', { context: 'illustratorController', error: error.message });
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
        logger.error('受注処理に失敗しました', { context: 'illustratorController', error: error.message });
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

        if (!eventId) {
            return res.status(400).json({ message: 'プロジェクトの指定は必須です。' });
        }
        const parsedAmount = parseInt(proposedAmount);
        if (isNaN(parsedAmount) || parsedAmount < 1 || parsedAmount > 10000000) {
            return res.status(400).json({ message: '希望金額は1〜10,000,000円の範囲で指定してください。' });
        }
        if (message && message.length > 2000) {
            return res.status(400).json({ message: 'メッセージは2000文字以内で入力してください。' });
        }

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
        logger.error('立候補の送信に失敗しました', { context: 'illustratorController', error: error.message });
        res.status(500).json({ message: '立候補の送信に失敗しました。' });
    }
};


// ==========================================
// 🎨 納品・承認フロー
// ==========================================

// PATCH /api/illustrators/projects/:projectId/deliver
// 絵師が納品物（イラストデータURL）を提出する
export const deliverIllustration = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { illustrationDataUrl } = req.body;

        if (!illustrationDataUrl?.trim()) {
            return res.status(400).json({ message: '納品データURLは必須です。' });
        }

        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project) return res.status(404).json({ message: 'プロジェクトが見つかりません。' });
        if (project.illustratorId !== req.user.id) {
            return res.status(403).json({ message: 'このプロジェクトの担当絵師ではありません。' });
        }
        if (project.isIllustrationAccepted) {
            return res.status(400).json({ message: 'すでに検収済みです。' });
        }

        const updated = await prisma.project.update({
            where: { id: projectId },
            data: { illustrationDataUrl: illustrationDataUrl.trim() },
        });

        res.json({ message: '納品物を提出しました。企画者の承認をお待ちください。', project: updated });
    } catch (error) {
        logger.error('deliverIllustration', { context: 'illustratorController', error: error.message });
        res.status(500).json({ message: '納品提出に失敗しました。' });
    }
};

// PATCH /api/illustrators/projects/:projectId/approve
// 企画者が納品物を承認し、絵師にポイントを支払う
export const approveIllustration = async (req, res) => {
    try {
        const { projectId } = req.params;
        const plannerId = req.user.id;

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { illustrator: true },
        });
        if (!project) return res.status(404).json({ message: 'プロジェクトが見つかりません。' });
        if (project.plannerId !== plannerId) {
            return res.status(403).json({ message: '権限がありません。' });
        }
        if (!project.illustratorId || !project.illustrationDataUrl) {
            return res.status(400).json({ message: '納品データが存在しません。' });
        }
        if (project.isIllustrationAccepted) {
            return res.status(400).json({ message: 'すでに検収済みです。' });
        }

        await prisma.$transaction(async (tx) => {
            // 承認フラグを立てる
            await tx.project.update({
                where: { id: projectId },
                data: { isIllustrationAccepted: true },
            });

            // 絵師にポイント（報酬）を加算
            if (project.illustratorReward) {
                await tx.user.update({
                    where: { id: project.illustratorId },
                    data: { points: { increment: project.illustratorReward } },
                });
            }
        });

        res.json({ message: '納品物を承認しました。絵師にポイントが支払われました。' });
    } catch (error) {
        logger.error('approveIllustration', { context: 'illustratorController', error: error.message });
        res.status(500).json({ message: '承認処理に失敗しました。' });
    }
};