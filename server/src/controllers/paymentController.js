import prisma from '../config/prisma.js';
import stripe from '../config/stripe.js';
import { sendEmail } from '../utils/email.js';

// レベル判定ロジック (支援時に実行)
const LEVEL_CONFIG = { 'Bronze': 10000, 'Silver': 50000, 'Gold': 100000 };
async function checkUserLevelAndBadges(tx, userId) {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) return;
    let newLevel = user.supportLevel;
    let levelChanged = false;
    for (const [levelName, threshold] of Object.entries(LEVEL_CONFIG)) {
        if (user.totalPledgedAmount >= threshold && 
           (user.supportLevel === null || LEVEL_CONFIG[user.supportLevel] < threshold)) {
            newLevel = levelName;
            levelChanged = true;
        }
    }
    if (levelChanged) {
        await tx.user.update({ where: { id: userId }, data: { supportLevel: newLevel } });
        // 通知作成ロジックは省略(必要ならNotificationテーブルへ)
    }
}

// 1. ポイント購入用セッション作成 (会員用)
export const createPointSession = async (req, res) => {
    const { amount, points } = req.body;
    const userId = req.user.id;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{ 
                price_data: { 
                    currency: 'jpy', 
                    product_data: { name: `${points} ポイント購入` }, 
                    unit_amount: amount, 
                }, 
                quantity: 1, 
            }],
            mode: 'payment',
            success_url: `${frontendUrl}/payment/success`,
            cancel_url: `${frontendUrl}/points`,
            client_reference_id: userId,
            metadata: { points },
        });
        res.json({ url: session.url });
    } catch (error) {
        res.status(500).json({ message: 'セッション作成失敗' });
    }
};

// 2. ゲスト支援用セッション作成
export const createGuestSession = async (req, res) => {
    const { projectId, amount, comment, tierId, guestName, guestEmail, successUrl, cancelUrl } = req.body;
    if (amount <= 0) return res.status(400).json({ message: '金額が無効です' });

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'jpy',
                    product_data: { name: `フラスタ企画支援: ${projectId}`, description: `${guestName}様` },
                    unit_amount: amount,
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: { projectId, tierId: tierId || 'none', comment: comment || '', isGuestPledge: 'true', guestName, guestEmail },
            customer_email: guestEmail,
        });
        res.json({ sessionUrl: session.url });
    } catch (error) {
        res.status(500).json({ message: 'セッション作成失敗' });
    }
};

// 3. 支援実行 (会員・ポイント払い)
export const createPledge = async (req, res) => {
    const userId = req.user.id;
    const { projectId, amount, comment, tierId } = req.body;
    let pledgeAmount = parseInt(amount, 10);

    try {
        // Tier確認
        if (tierId) {
            const tier = await prisma.pledgeTier.findUnique({ where: { id: tierId } });
            if (tier) pledgeAmount = tier.amount;
        }
        if (isNaN(pledgeAmount) || pledgeAmount <= 0) return res.status(400).json({ message: '金額エラー' });

        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({ where: { id: userId } });
            const project = await tx.project.findUnique({ where: { id: projectId }, include: { planner: true } });
            
            if (!user || !project) throw new Error('データが見つかりません');
            if (project.status !== 'FUNDRAISING') throw new Error('募集中ではありません');
            if (user.points < pledgeAmount) throw new Error('ポイント不足');

            // ポイント消費
            await tx.user.update({
                where: { id: userId },
                data: { points: { decrement: pledgeAmount }, totalPledgedAmount: { increment: pledgeAmount } },
            });

            // 支援作成
            const newPledge = await tx.pledge.create({
                data: { amount: pledgeAmount, projectId, userId, comment, pledgeTierId: tierId || null },
            });

            // 企画更新
            const updatedProject = await tx.project.update({
                where: { id: projectId },
                data: { collectedAmount: { increment: pledgeAmount } },
            });

            // 通知
            await prisma.notification.create({
                data: { recipientId: updatedProject.plannerId, type: 'NEW_PLEDGE', message: `${user.handleName}さんから支援がありました！`, projectId, linkUrl: `/projects/${projectId}` }
            });

            // 達成チェック
            if (updatedProject.collectedAmount >= updatedProject.targetAmount && project.status !== 'SUCCESSFUL') {
                await tx.project.update({ where: { id: projectId }, data: { status: 'SUCCESSFUL' } });
                sendEmail(project.planner.email, '目標達成おめでとうございます', `<p>${project.title}が目標を達成しました！</p>`);
            }

            await checkUserLevelAndBadges(tx, userId);
            return newPledge;
        });

        // 完了メール (非同期)
        const userEmail = req.user.email;
        sendEmail(userEmail, '支援完了のお知らせ', `<p>${pledgeAmount}ptの支援を受け付けました。</p>`);

        res.status(201).json(result);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: error.message || '支援失敗' });
    }
};

// ==========================================
// ★★★ 追加: ゲスト支援の直接登録 (Stripeページ非経由) ★★★
// ==========================================
export const createGuestPledgeDirect = async (req, res) => {
    const { projectId, amount, comment, tierId, guestName, guestEmail } = req.body;

    if (!guestName || !guestEmail) {
        return res.status(400).json({ message: 'お名前とメールアドレスは必須です。' });
    }

    let pledgeAmount = parseInt(amount, 10);

    try {
        const result = await prisma.$transaction(async (tx) => {
            const project = await tx.project.findUnique({ 
                where: { id: projectId },
                include: { planner: true }
            });
            if (!project) throw new Error('企画が見つかりません。');
            if (project.status !== 'FUNDRAISING') throw new Error('募集中ではありません。');

            if (tierId) {
                const tier = await tx.pledgeTier.findUnique({ where: { id: tierId } });
                if (!tier) throw new Error('支援コースが見つかりません。');
                pledgeAmount = tier.amount;
            }

            if (isNaN(pledgeAmount) || pledgeAmount <= 0) throw new Error('金額が無効です。');

            // 支援作成
            const newPledge = await tx.pledge.create({
                data: {
                    amount: pledgeAmount,
                    projectId,
                    userId: null, // ゲスト
                    guestName,
                    guestEmail,
                    comment,
                    pledgeTierId: tierId || null,
                },
            });

            // 集計更新
            const updatedProject = await tx.project.update({
                where: { id: projectId },
                data: { collectedAmount: { increment: pledgeAmount } },
            });

            // 通知
            await prisma.notification.create({
                data: {
                    recipientId: project.plannerId,
                    type: 'NEW_PLEDGE',
                    message: `ゲスト(${guestName}様)より ${pledgeAmount.toLocaleString()}円 の支援がありました`,
                    projectId,
                    linkUrl: `/projects/${projectId}`
                }
            });

            // メール送信 (utils/email.js の関数を使用)
            sendEmail(guestEmail, '【FLASTAL】支援完了のお知らせ', `<p>${project.title} へ ${pledgeAmount}円 の支援を受け付けました。</p>`);

            return newPledge;
        });

        res.status(201).json({ message: 'ゲスト支援が完了しました！', pledge: result });
    } catch (error) {
        console.error('ゲスト支援エラー:', error);
        res.status(400).json({ message: error.message || 'エラーが発生しました。' });
    }
};