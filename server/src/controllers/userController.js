import prisma from '../config/prisma.js';

// ==========================================
// ★★★ 取得系 (Public & Private) ★★★
// ==========================================

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
        console.error("プロフィール更新エラー:", error);
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
        console.error('submitKyc:', err);
        res.status(500).json({ message: 'KYC申請に失敗しました' });
    }
};

// ==========================================
// 紹介/アフィリエイト統計
// ==========================================
export const getReferralStats = async (req, res) => {
    const userId = req.user.id;
    try {
        const [user, referredUsers, conversions] = await Promise.all([
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
        ]);

        const totalReward = conversions.reduce((s, c) => s + c.reward, 0);
        const totalPledge = conversions.reduce((s, c) => s + c.pledgeAmount, 0);

        res.json({
            referralCode: user?.referralCode,
            referralUrl: user?.referralCode
                ? `https://www.flastal.com/register?ref=${user.referralCode}`
                : null,
            points: user?.points ?? 0,
            referredCount: referredUsers.length,
            referredUsers,
            conversionCount: conversions.length,
            totalReward,
            totalPledge,
            conversions,
        });
    } catch (err) {
        console.error('getReferralStats:', err);
        res.status(500).json({ message: 'エラーが発生しました' });
    }
};
