import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { logger } from '../utils/logger.js';

// ==========================================
// ★★★ 取得系 (Public & Private) ★★★
// ==========================================

// 自分の最新情報取得（ロール確認用）
export const getMe = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, email: true, handleName: true, role: true, roles: true, iconUrl: true, status: true, points: true, supportLevel: true, referralCode: true },
        });
        if (!user) return res.status(404).json({ message: 'ユーザーが見つかりません' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'サーバーエラー' });
    }
};

// 公開プロフィール取得
export const getPublicProfile = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true, handleName: true, iconUrl: true, bio: true,
                favoriteGenres: true, twitterUrl: true, instagramUrl: true,
                isProfilePublic: true, totalPledgedAmount: true, supportLevel: true, badgeIds: true,
                createdAt: true,
                pledges: {
                    where: { project: { status: { in: ['SUCCESSFUL', 'COMPLETED'] }, visibility: 'PUBLIC' } },
                    include: { project: { select: { id: true, title: true, imageUrl: true, status: true, collectedAmount: true } } },
                    orderBy: { createdAt: 'desc' }
                },
                createdProjects: {
                    where: { status: { in: ['SUCCESSFUL', 'COMPLETED', 'FUNDRAISING'] }, visibility: 'PUBLIC' },
                    select: { id: true, title: true, imageUrl: true, status: true, collectedAmount: true, targetAmount: true },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!user) return res.status(404).json({ message: 'ユーザーが見つかりません' });
        if (!user.isProfilePublic) return res.status(403).json({ message: 'このプロフィールは非公開です' });

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'プロフィールの取得に失敗しました' });
    }
};

// 作成した企画一覧 (My Page用)
export const getCreatedProjects = async (req, res) => {
    const { userId } = req.params;
    try {
        const projects = await prisma.project.findMany({
            where: { 
                plannerId: userId,
                // ★ 修正: 管理者が「非表示(UNLISTED)」にしたものや、「BAN/却下(REJECTED)」にしたものを一覧から除外する
                visibility: 'PUBLIC', 
                NOT: { status: 'REJECTED' } 
            },
            orderBy: { createdAt: 'desc' },
            include: {
                offers: { include: { chatRoom: true, florist: true } },
                review: true,
            }
        });
        res.status(200).json(projects);
    } catch (error) {
        res.status(500).json({ message: '作成した企画の取得中にエラーが発生しました。' });
    }
};

// 支援した企画一覧
export const getPledgedProjects = async (req, res) => {
    const { userId } = req.params;
    try {
        const pledges = await prisma.pledge.findMany({
            where: { 
                userId: userId,
                // ★ 修正: 自分が支援した企画でも、あとからBANされたり非表示になったものは表示しない
                project: {
                    visibility: 'PUBLIC',
                    NOT: { status: 'REJECTED' }
                }
            },
            orderBy: { createdAt: 'desc' },
            include: { project: true }
        });
        res.status(200).json(pledges);
    } catch (error) {
        res.status(500).json({ message: '支援した企画の取得中にエラーが発生しました。' });
    }
};

// オファー可能な企画一覧 (募集中/達成済み かつ 未オファー)
export const getOfferableProjects = async (req, res) => {
    const { userId } = req.params;
    try {
        const projects = await prisma.project.findMany({
            where: {
                plannerId: userId,
                visibility: 'PUBLIC', // ★ 念のため追加
                OR: [{ status: 'FUNDRAISING' }, { status: 'SUCCESSFUL' }],
                offers: { none: {} },
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(projects);
    } catch (error) {
        res.status(500).json({ message: '企画の取得中にエラーが発生しました。' });
    }
};

// ==========================================
// ★★★ 更新系 (Auth Required) ★★★
// ==========================================

// プロフィール更新
export const updateProfile = async (req, res) => {
    const userId = req.user.id;
    const { handleName, iconUrl, bio, favoriteGenres, twitterUrl, instagramUrl, isProfilePublic } = req.body;

    try {
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                handleName, iconUrl, bio, favoriteGenres,
                twitterUrl, instagramUrl, isProfilePublic
            },
        });
        // パスワードを除外して返す
        const { password, ...userWithoutPassword } = updatedUser;
        res.json(userWithoutPassword);
    } catch (error) {
        logger.error('プロフィール更新エラー', { context: 'userController', error: error.message });
        res.status(500).json({ message: 'プロフィールの更新に失敗しました。' });
    }
};

// ==========================================
// ★★★ 通知・その他 ★★★
// ==========================================

// 通知一覧取得
export const getNotifications = async (req, res) => {
    const userId = req.user.id;
    try {
        const notifications = await prisma.notification.findMany({
            where: { recipientId: userId },
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: { project: { select: { title: true } } }
        });
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ message: '通知の取得中にエラーが発生しました。' });
    }
};

// 通知既読化
export const markNotificationRead = async (req, res) => {
    const { notificationId } = req.params;
    const userId = req.user.id;
    try {
        const updated = await prisma.notification.updateMany({
            where: { id: notificationId, recipientId: userId, isRead: false },
            data: { isRead: true }
        });
        if (updated.count === 1) {
            res.status(200).json({ message: '通知を既読にしました。' });
        } else {
            res.status(200).json({ message: '通知は既に既読か存在しません。' });
        }
    } catch (error) {
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
};

export const markAllNotificationsRead = async (req, res) => {
    const userId = req.user.id;
    try {
        const result = await prisma.notification.updateMany({
            where: { recipientId: userId, isRead: false },
            data: { isRead: true },
        });
        res.status(200).json({ count: result.count });
    } catch {
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
};

// 銀行口座登録 (花屋・ユーザー共通)
export const registerBankAccount = async (req, res) => {
    const { bankName, branchName, accountType, accountNumber, accountHolder } = req.body;
    try {
        const account = await prisma.bankAccount.upsert({
            where: { userId: req.user.id },
            update: { bankName, branchName, accountType, accountNumber, accountHolder },
            create: {
                userId: req.user.id,
                bankName, branchName, accountType, accountNumber, accountHolder
            }
        });
        res.json(account);
    } catch (error) {
        res.status(500).json({ message: '口座情報の保存に失敗しました' });
    }
};

// 銀行口座取得
export const getBankAccount = async (req, res) => {
    try {
        const account = await prisma.bankAccount.findUnique({
            where: { userId: req.user.id }
        });
        res.json(account || {});
    } catch (error) {
        res.status(500).json({ message: '口座情報の取得に失敗しました' });
    }
};

// ==========================================
// ★★★ 追加: ユーザー出金機能 (Point -> Cash) ★★★
// ==========================================

// ユーザー出金履歴
export const getUserPayouts = async (req, res) => {
    try {
        const payouts = await prisma.payout.findMany({
            where: { userId: req.user.id },
            orderBy: { requestedAt: 'desc' }
        });
        res.json(payouts);
    } catch (error) {
        res.status(500).json({ message: '履歴の取得に失敗しました' });
    }
};

// ユーザー出金申請
export const requestUserPayout = async (req, res) => {
    const { amount } = req.body;
    const requestAmount = parseInt(amount);
    const TRANSFER_FEE = 250; // 振込手数料 (一律)

    if (requestAmount < 1000) return res.status(400).json({ message: '1000ptから申請可能です。' });

    try {
        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({ where: { id: req.user.id } });
            if (user.points < requestAmount) throw new Error('ポイント残高が不足しています。');

            // KYC チェック: 累計出金が 100,000pt 超の場合は本人確認必須
            const payoutSum = await tx.payout.aggregate({ _sum: { amount: true }, where: { userId: req.user.id } });
            const cumulative = (payoutSum._sum.amount || 0) + requestAmount;
            if (cumulative >= 100000 && user.kycStatus !== 'APPROVED') {
                throw new Error('累計出金が10万ptを超えるため、本人確認が必要です。マイページ > 設定 > 本人確認から申請してください。');
            }

            const bank = await tx.bankAccount.findUnique({ where: { userId: req.user.id } });
            if (!bank) throw new Error('先に振込先口座を登録してください。');

            // ポイント減算
            await tx.user.update({
                where: { id: req.user.id },
                data: { points: { decrement: requestAmount } }
            });

            // 申請作成 (Payoutテーブル)
            return await tx.payout.create({
                data: {
                    userId: req.user.id,
                    amount: requestAmount,
                    fee: TRANSFER_FEE,
                    finalAmount: requestAmount - TRANSFER_FEE,
                    status: 'PENDING'
                }
            });
        });
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({ message: error.message || '申請エラー' });
    }
};

export const updateThemeColor = async (req, res) => {
    try {
        const { themeColor } = req.body;
        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: { themeColor }
        });
        res.json({ message: 'テーマカラーを更新しました', themeColor: updatedUser.themeColor });
    } catch (error) {
        res.status(500).json({ message: '更新に失敗しました' });
    }
};
// ポイントチャージ履歴（WebhookLogから取得）
export const getPointHistory = async (req, res) => {
    const userId = req.user.id;
    try {
        const logs = await prisma.webhookLog.findMany({
            where: {
                eventType: 'checkout.session.completed',
                status: 'success',
                metadata: { path: ['userId'], equals: userId },
            },
            orderBy: { createdAt: 'desc' },
            take: 30,
        });
        const history = logs.map(l => ({
            id: l.id,
            points: l.metadata?.points || 0,
            createdAt: l.createdAt,
        }));
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: '履歴の取得に失敗しました' });
    }
};

// ==========================================
// GET /api/users/point-history
// ポイント取引履歴（総合：チャージ・支援使用・返金など）
// ==========================================
export const getPointTransactionHistory = async (req, res) => {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    try {
        // PointTransactionモデルが存在する場合はそちらを優先
        let transactions = [];
        let total = 0;
        let currentBalance = 0;

        try {
            [transactions, total] = await Promise.all([
                prisma.pointTransaction.findMany({
                    where: { userId },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: parseInt(limit),
                }),
                prisma.pointTransaction.count({ where: { userId } }),
            ]);
        } catch (_) {
            // PointTransactionテーブルが存在しない場合はWebhookLogからチャージ分のみ返す
            const logs = await prisma.webhookLog.findMany({
                where: {
                    eventType: 'checkout.session.completed',
                    status: 'success',
                    metadata: { path: ['userId'], equals: userId },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit),
            });
            const countLogs = await prisma.webhookLog.count({
                where: {
                    eventType: 'checkout.session.completed',
                    status: 'success',
                    metadata: { path: ['userId'], equals: userId },
                },
            });
            transactions = logs.map(l => ({
                id: l.id,
                type: 'POINT_CHARGE',
                amount: l.metadata?.points || 0,
                note: 'ポイントチャージ',
                createdAt: l.createdAt,
            }));
            total = countLogs;
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { points: true },
        });
        currentBalance = user?.points ?? 0;

        res.json({
            transactions,
            total,
            currentBalance,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
        });
    } catch (err) {
        logger.error('error', { context: 'PointHistory', error: err.message });
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { points: true } }).catch(() => null);
        res.json({ transactions: [], total: 0, currentBalance: user?.points ?? 0, page: 1, totalPages: 0 });
    }
};

// ==========================================
// フォロー / アンフォロー
// ==========================================
export const followUser = async (req, res) => {
    const followerId = req.user.id;
    const { userId: followingId } = req.params;
    if (followerId === followingId) return res.status(400).json({ message: '自分をフォローできません' });
    try {
        await prisma.follow.upsert({
            where: { followerId_followingId: { followerId, followingId } },
            create: { followerId, followingId },
            update: {},
        });
        res.json({ following: true });
    } catch (err) {
        res.status(500).json({ message: 'フォローに失敗しました' });
    }
};

export const unfollowUser = async (req, res) => {
    const followerId = req.user.id;
    const { userId: followingId } = req.params;
    try {
        await prisma.follow.deleteMany({ where: { followerId, followingId } });
        res.json({ following: false });
    } catch (err) {
        res.status(500).json({ message: 'アンフォローに失敗しました' });
    }
};

export const getFollowStatus = async (req, res) => {
    const followerId = req.user.id;
    const { userId: followingId } = req.params;
    const follow = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId, followingId } },
    });
    const counts = await prisma.user.findUnique({
        where: { id: followingId },
        select: {
            _count: { select: { followers: true, following: true } },
        },
    });
    res.json({
        following: !!follow,
        followersCount: counts?._count?.followers ?? 0,
        followingCount: counts?._count?.following ?? 0,
    });
};

// フォロー中の企画者の新着企画フィード
export const getFollowingFeed = async (req, res) => {
    const userId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 20;
    const skip = (page - 1) * limit;
    try {
        const follows = await prisma.follow.findMany({
            where: { followerId: userId },
            select: { followingId: true },
        });
        const followingIds = follows.map(f => f.followingId);
        if (followingIds.length === 0) return res.json({ projects: [], total: 0, page, pages: 0 });

        const [projects, total] = await Promise.all([
            prisma.project.findMany({
                where: {
                    plannerId: { in: followingIds },
                    status: 'FUNDRAISING',
                    projectType: 'PUBLIC',
                },
                include: {
                    planner: { select: { id: true, handleName: true, iconUrl: true } },
                    _count: { select: { pledges: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.project.count({
                where: {
                    plannerId: { in: followingIds },
                    status: 'FUNDRAISING',
                    projectType: 'PUBLIC',
                },
            }),
        ]);
        res.json({ projects, total, page, pages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ message: 'フィードの取得に失敗しました' });
    }
};

// ==========================================
// ★ KYC 申請（出金10万pt超で必要）
// ==========================================
export const submitKyc = async (req, res) => {
    const userId = req.user.id;
    const { documentUrl } = req.body;
    if (!documentUrl) return res.status(400).json({ message: '書類URLが必要です' });

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { kycStatus: true, totalPledgedAmount: true },
        });

        if (user.kycStatus === 'APPROVED') {
            return res.status(400).json({ message: 'すでに本人確認が完了しています' });
        }

        await prisma.user.update({
            where: { id: userId },
            data: { kycStatus: 'PENDING', kycDocumentUrl: documentUrl },
        });

        res.json({ message: '本人確認書類を受け付けました。審査には1〜3営業日かかります。' });
    } catch (err) {
        logger.error('submitKyc', { context: 'userController', error: err.message });
        res.status(500).json({ message: 'KYC申請に失敗しました' });
    }
};

// ==========================================
// 紹介/アフィリエイト統計
// ==========================================
// ==========================================
// 通知設定
// ==========================================

// GET /api/users/notification-settings
export const getNotificationSettings = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { notificationSettings: true },
        });
        const defaults = {
            push_new_pledge: true,
            push_project_complete: true,
            push_live_start: true,
            push_group_buy_funded: true,
            email_pledge_received: true,
            email_project_funded: true,
            email_project_complete: true,
        };
        res.json({ ...defaults, ...(user?.notificationSettings || {}) });
    } catch (error) {
        res.status(500).json({ message: '通知設定の取得に失敗しました' });
    }
};

// PUT /api/users/notification-settings
export const updateNotificationSettings = async (req, res) => {
    try {
        const settings = req.body;
        const updated = await prisma.user.update({
            where: { id: req.user.id },
            data: { notificationSettings: settings },
            select: { notificationSettings: true },
        });
        res.json(updated.notificationSettings);
    } catch (error) {
        res.status(500).json({ message: '通知設定の保存に失敗しました' });
    }
};

// ==========================================
// ★ パスワード変更（ログイン中）
// ==========================================
export const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: '現在のパスワードと新しいパスワードを入力してください。' });
    }
    if (newPassword.length < 8) {
        return res.status(400).json({ message: 'パスワードは8文字以上で設定してください。' });
    }
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { password: true } });
        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) return res.status(400).json({ message: '現在のパスワードが正しくありません。' });
        const hashed = await bcrypt.hash(newPassword, 12);
        await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });
        res.json({ message: 'パスワードを変更しました。' });
    } catch (err) {
        logger.error('changePassword', { context: 'userController', error: err.message });
        res.status(500).json({ message: 'パスワードの変更に失敗しました。' });
    }
};

// ==========================================
// ★ メールアドレス変更リクエスト
// ==========================================
export const requestEmailChange = async (req, res) => {
    const { newEmail } = req.body;
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
        return res.status(400).json({ message: '有効なメールアドレスを入力してください。' });
    }
    try {
        const existing = await prisma.user.findUnique({ where: { email: newEmail } });
        if (existing) return res.status(400).json({ message: 'このメールアドレスは既に使用されています。' });

        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24時間

        await prisma.user.update({
            where: { id: req.user.id },
            data: { pendingEmail: newEmail, emailChangeToken: token, emailChangeExpires: expires },
        });

        const { queueEmail } = await import('../utils/email.js');
        const frontendUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://www.flastal.com';
        queueEmail(newEmail, 'EMAIL_CHANGE_CONFIRM', {
            newEmail,
            confirmUrl: `${frontendUrl}/auth/confirm-email-change?token=${token}`,
        });

        res.json({ message: `${newEmail} に確認メールを送信しました。24時間以内にご確認ください。` });
    } catch (err) {
        logger.error('requestEmailChange', { context: 'userController', error: err.message });
        res.status(500).json({ message: 'メールアドレス変更の申請に失敗しました。' });
    }
};

// ==========================================
// ★ メールアドレス変更確認（トークン検証）
// ==========================================
export const confirmEmailChange = async (req, res) => {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: 'トークンが指定されていません。' });
    try {
        const user = await prisma.user.findFirst({
            where: { emailChangeToken: token, emailChangeExpires: { gt: new Date() } },
        });
        if (!user || !user.pendingEmail) {
            return res.status(400).json({ message: 'トークンが無効または期限切れです。' });
        }
        await prisma.user.update({
            where: { id: user.id },
            data: {
                email: user.pendingEmail,
                pendingEmail: null,
                emailChangeToken: null,
                emailChangeExpires: null,
            },
        });
        res.json({ message: 'メールアドレスを変更しました。' });
    } catch (err) {
        logger.error('confirmEmailChange', { context: 'userController', error: err.message });
        res.status(500).json({ message: 'メールアドレスの変更に失敗しました。' });
    }
};

export const getReferralStats = async (req, res) => {
    const userId = req.user.id;
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [user, referredUsers, conversions, thisMonthReferredCount] = await Promise.all([
            prisma.user.findUnique({
                where: { id: userId },
                select: { referralCode: true, points: true },
            }),
            prisma.user.findMany({
                where: { referredById: userId },
                select: { id: true, handleName: true, iconUrl: true, createdAt: true },
                orderBy: { createdAt: 'desc' },
                take: 50,
            }),
            prisma.affiliateConversion.findMany({
                where: { referrerId: userId },
                orderBy: { createdAt: 'desc' },
                take: 50,
            }),
            prisma.user.count({
                where: { referredById: userId, createdAt: { gte: startOfMonth } },
            }),
        ]);

        const totalReward = conversions.reduce((s, c) => s + c.reward, 0);
        const totalPledge = conversions.reduce((s, c) => s + c.pledgeAmount, 0);

        res.json({
            referralCode: user?.referralCode,
            referralUrl: user?.referralCode
                ? `https://flastal.com/register?ref=${user.referralCode}`
                : null,
            points: user?.points ?? 0,
            referredCount: referredUsers.length,
            thisMonthReferredCount,
            referredUsers,
            conversionCount: conversions.length,
            totalReward,
            totalPledge,
            conversions,
        });
    } catch (err) {
        logger.error('getReferralStats', { context: 'userController', error: err.message });
        res.status(500).json({ message: 'エラーが発生しました' });
    }
};

// ==========================================
// PATCH /api/users/pledges/:pledgeId/confirm-received
// フラワースタンド受け取り確認
// ==========================================
export const confirmPledgeReceived = async (req, res) => {
    try {
        const userId = req.user.id;
        const { pledgeId } = req.params;

        const pledge = await prisma.pledge.findUnique({
            where: { id: pledgeId },
            include: { project: { select: { id: true, title: true, plannerId: true } } },
        });

        if (!pledge) return res.status(404).json({ message: '支援記録が見つかりません。' });
        if (pledge.userId !== userId) return res.status(403).json({ message: '権限がありません。' });
        if (pledge.receivedAt) return res.status(400).json({ message: 'すでに受け取り確認済みです。' });

        const updated = await prisma.pledge.update({
            where: { id: pledgeId },
            data: { receivedAt: new Date() },
        });

        // 企画者へ受け取り確認の通知を送信
        if (pledge.project?.plannerId) {
            const { createNotification } = await import('../utils/notification.js');
            createNotification(
                pledge.project.plannerId,
                'PROJECT_STATUS_UPDATE',
                `${req.user.handleName || 'サポーター'}さんがフラワースタンドの受け取りを確認しました`,
                pledge.project.id,
                `/projects/${pledge.project.id}`
            ).catch(() => {});
        }

        res.json({ message: '受け取り確認が完了しました。', receivedAt: updated.receivedAt });
    } catch (err) {
        logger.error('confirmReceived error', { context: 'Pledge', error: err.message });
        res.status(500).json({ message: '受け取り確認に失敗しました。' });
    }
};

// ==========================================
// GET /api/users/push-subscriptions
// 登録済みプッシュ通知デバイス一覧
// ==========================================
export const getPushSubscriptions = async (req, res) => {
    try {
        const userId = req.user.id;
        const subs = await prisma.pushSubscription.findMany({
            where: { userId },
            select: { id: true, createdAt: true, endpoint: true },
            orderBy: { createdAt: 'desc' },
        });
        const devices = subs.map(s => ({
            id: s.id,
            createdAt: s.createdAt,
            label: s.endpoint.includes('fcm.googleapis.com') ? 'Android/Chrome' :
                   s.endpoint.includes('push.apple.com') ? 'Safari/iPhone' : 'ブラウザ',
            endpointSuffix: s.endpoint.slice(-8),
        }));
        res.json(devices);
    } catch (err) {
        logger.error('getSubscriptions error', { context: 'PushSubscription', error: err.message });
        res.status(500).json({ message: 'デバイス一覧の取得に失敗しました。' });
    }
};

// ==========================================
// DELETE /api/users/push-subscriptions/:id
// プッシュ通知デバイス削除
// ==========================================
export const deletePushSubscription = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        await prisma.pushSubscription.deleteMany({ where: { id, userId } });
        res.json({ message: 'デバイスの登録を解除しました。' });
    } catch (err) {
        logger.error('deleteSubscription error', { context: 'PushSubscription', error: err.message });
        res.status(500).json({ message: '解除に失敗しました。' });
    }
};

// ==========================================
// GET /api/users/badges
// ユーザーのバッジ一覧（獲得済み・未獲得）を返す
// ==========================================
export const getUserBadges = async (req, res) => {
    const userId = req.user.id;
    try {
        const { BADGE_DEFS } = await import('../utils/badges.js');

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { badgeIds: true },
        });

        const earnedIds = new Set(user?.badgeIds || []);

        const earned = Object.values(BADGE_DEFS)
            .filter(b => earnedIds.has(b.id))
            .map(b => ({
                id: b.id,
                name: b.label,
                icon: b.emoji,
                description: b.description,
            }));

        const locked = Object.values(BADGE_DEFS)
            .filter(b => !earnedIds.has(b.id))
            .map(b => ({
                id: b.id,
                name: b.label,
                icon: b.emoji,
                description: b.description,
                condition: b.description,
            }));

        res.json({ earned, locked });
    } catch (err) {
        logger.error('getUserBadges', { context: 'userController', error: err.message });
        res.status(500).json({ message: 'エラーが発生しました' });
    }
};


// ==========================================
// DELETE /api/users/me
// アカウント削除 (Guideline 5.1.1(v))
// ==========================================
export const deleteMyAccount = async (req, res) => {
    const userId = req.user.id;
    try {
        const activeProject = await prisma.project.findFirst({
            where: { plannerId: userId, status: { in: ['FUNDRAISING', 'SUCCESSFUL', 'PROCESSING', 'READY_FOR_DELIVERY'] } },
            select: { id: true },
        });
        if (activeProject) {
            return res.status(400).json({ message: '進行中の企画があるためアカウントを削除できません。企画を終了または中止してから再度お試しください。' });
        }

        await prisma.$transaction([
            // Reports (reporter FK)
            prisma.projectReport.deleteMany({ where: { reporterId: userId } }),
            prisma.eventReport.deleteMany({ where: { reporterId: userId } }),
            prisma.groupChatMessageReport.deleteMany({ where: { reporterId: userId } }),
            prisma.chatMessageReport.deleteMany({ where: { reporterId: userId } }),
            // Likes / reactions (must come before parent records)
            prisma.postLike.deleteMany({ where: { userId } }),
            prisma.postComment.deleteMany({ where: { userId } }),
            prisma.reviewLike.deleteMany({ where: { userId } }),
            prisma.floristPostLike.deleteMany({ where: { userId } }),
            prisma.moodBoardLike.deleteMany({ where: { userId } }),
            prisma.groupChatMessageReaction.deleteMany({ where: { userId } }),
            // Parent records that own content
            prisma.review.deleteMany({ where: { userId } }),
            prisma.moodBoardItem.deleteMany({ where: { userId } }),
            prisma.projectPost.deleteMany({ where: { userId } }),
            prisma.post.deleteMany({ where: { userId } }),
            prisma.message.deleteMany({ where: { userId } }),
            prisma.superchat.deleteMany({ where: { userId } }),
            prisma.payout.deleteMany({ where: { userId } }),
            // Social / activity
            prisma.notification.deleteMany({ where: { userId } }),
            prisma.pushSubscription.deleteMany({ where: { userId } }),
            prisma.follow.deleteMany({ where: { OR: [{ followerId: userId }, { followingId: userId }] } }),
            prisma.pollVote.deleteMany({ where: { userId } }),
            prisma.groupChatMessage.deleteMany({ where: { userId } }),
            prisma.chatMessage.deleteMany({ where: { senderId: userId } }),
            prisma.floristFavorite.deleteMany({ where: { userId } }),
            prisma.cheer.deleteMany({ where: { userId } }),
            prisma.artistPageFollow.deleteMany({ where: { userId } }),
            prisma.eventInterest.deleteMany({ where: { userId } }),
            prisma.groupBuyEntry.deleteMany({ where: { userId } }),
            prisma.pledge.updateMany({ where: { userId }, data: { userId: null } }),
            prisma.user.delete({ where: { id: userId } }),
        ]);

        logger.info('deleteMyAccount: account deleted', { userId });
        res.json({ message: 'アカウントを削除しました。ご利用ありがとうございました。' });
    } catch (err) {
        logger.error('deleteMyAccount error', { context: 'userController', error: err.message, userId });
        res.status(500).json({ message: 'アカウントの削除に失敗しました。' });
    }
};
