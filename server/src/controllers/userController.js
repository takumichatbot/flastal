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
                favoriteGenres: true, twitterUrl: true, instagramUrl: true, isProfilePublic: true,
                pledges: {
                    where: { project: { status: { in: ['SUCCESSFUL', 'COMPLETED'] }, visibility: 'PUBLIC' } },
                    include: { project: { select: { id: true, title: true, imageUrl: true, status: true } } },
                    orderBy: { createdAt: 'desc' }
                },
                createdProjects: {
                    where: { status: { in: ['SUCCESSFUL', 'COMPLETED', 'FUNDRAISING'] }, visibility: 'PUBLIC' },
                    select: { id: true, title: true, imageUrl: true, status: true },
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
            where: { plannerId: userId },
            orderBy: { createdAt: 'desc' },
            include: {
                offer: { include: { chatRoom: true, florist: true } },
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
            where: { userId: userId },
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
                OR: [{ status: 'FUNDRAISING' }, { status: 'SUCCESSFUL' }],
                offer: null,
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