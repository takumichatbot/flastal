import prisma from '../config/prisma.js';
import stripe from '../config/stripe.js';
import { sendEmail } from '../utils/email.js';
import { getIO } from '../config/socket.js';

const LEVEL_CONFIG = { 'Bronze': 10000, 'Silver': 50000, 'Gold': 100000 };

export async function checkUserLevelAndBadges(tx, userId) {
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
    }
}

export const broadcastTicker = (type, text, href) => {
    try {
        const io = getIO();
        io.emit('publicTickerUpdate', { 
            id: Date.now(), 
            type, 
            text, 
            href,
            createdAt: new Date()
        });
    } catch (e) {
        console.warn('Socket emit failed:', e.message);
    }
};

// ==========================================
// ★ ポイントチャージのセッション作成
// ==========================================
export const createPointSession = async (req, res) => {
    const { amount, points } = req.body;
    const userId = req.user.id;
    const frontendUrl = req.headers.origin || process.env.FRONTEND_URL || 'https://www.flastal.com';

    if (!amount || !points) {
        return res.status(400).json({ message: '金額とポイント数が正しくありません。' });
    }

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{ 
                price_data: { 
                    currency: 'jpy', 
                    product_data: { 
                        name: `FLASTAL ${points.toLocaleString()} ポイント`,
                        description: '企画の支援に使用できる専用ポイントです。'
                    }, 
                    unit_amount: parseInt(amount, 10), 
                }, 
                quantity: 1, 
            }],
            mode: 'payment',
            success_url: `${frontendUrl}/points?status=success`,
            cancel_url: `${frontendUrl}/points?status=cancel`,
            client_reference_id: userId,
            metadata: { 
                points: points.toString(),
                type: 'point_charge' // webhook側で判定するため
            },
        });
        res.json({ url: session.url });
    } catch (error) {
        console.error("Stripe Session Error (Points):", error);
        res.status(500).json({ message: 'セッション作成に失敗しました: ' + error.message });
    }
};

// ==========================================
// ★ 新規: 統合チェックアウトセッション (ハイブリッド決済対応)
// ==========================================
export const createCheckoutSession = async (req, res) => {
    const { 
        projectId, amount, pointsToUse, cardAmount, 
        comment, tierId, guestName, guestEmail, successUrl, cancelUrl 
    } = req.body;

    // req.user が存在すればログインユーザー、存在しなければゲスト
    const userId = req.user ? req.user.id : null;

    // カード決済額が 0 以下の場合はエラー (全額ポイント決済の場合は createPledge を呼ぶべき)
    if (!cardAmount || cardAmount <= 0) {
        return res.status(400).json({ message: 'クレジットカードでの決済金額が無効です' });
    }

    try {
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project) return res.status(404).json({ message: '企画が見つかりません' });

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'jpy',
                    product_data: { 
                        name: `企画支援: ${project.title}`,
                        description: userId 
                            ? `支援総額 ${amount}円 (ポイント充当: ${pointsToUse || 0}pt)` 
                            : `ゲスト支援: ${guestName}様`
                    },
                    unit_amount: parseInt(cardAmount),
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: successUrl,
            cancel_url: cancelUrl,
            customer_email: userId ? req.user.email : guestEmail,
            client_reference_id: userId || undefined,
            metadata: {
                type: 'pledge',
                projectId: projectId,
                userId: userId || 'guest',
                totalAmount: amount.toString(),
                pointsUsed: (pointsToUse || 0).toString(),
                cardAmount: cardAmount.toString(),
                tierId: tierId || 'none',
                comment: comment || '',
                guestName: guestName || '',
                guestEmail: guestEmail || ''
            },
        });

        res.json({ sessionUrl: session.url });
    } catch (error) {
        console.error("Checkout Session Error:", error);
        res.status(500).json({ message: 'セッション作成に失敗しました' });
    }
};

// ==========================================
// ★ 支援 (全額ポイント支払い)
// ==========================================
export const createPledge = async (req, res) => {
    const userId = req.user.id;
    const { projectId, amount, comment, tierId } = req.body;
    let pledgeAmount = parseInt(amount, 10);

    try {
        const result = await prisma.$transaction(async (tx) => {
            if (tierId) {
                const tier = await tx.pledgeTier.findUnique({ where: { id: tierId } });
                if (tier) pledgeAmount = tier.amount;
            }
            if (isNaN(pledgeAmount) || pledgeAmount <= 0) throw new Error('支援金額が正しくありません');

            const user = await tx.user.findUnique({ where: { id: userId } });
            const project = await tx.project.findUnique({ where: { id: projectId }, include: { planner: true } });
            
            if (!user || !project) throw new Error('対象のデータが見つかりません');
            if (project.status !== 'FUNDRAISING') throw new Error('この企画は現在募集を停止しています');
            if (user.points < pledgeAmount) throw new Error('ポイントが不足しています');

            // ポイント減算と合計支援額の加算
            await tx.user.update({
                where: { id: userId },
                data: { points: { decrement: pledgeAmount }, totalPledgedAmount: { increment: pledgeAmount } },
            });

            const newPledge = await tx.pledge.create({
                data: { amount: pledgeAmount, projectId, userId, comment, pledgeTierId: tierId || null },
            });

            const updatedProject = await tx.project.update({
                where: { id: projectId },
                data: { collectedAmount: { increment: pledgeAmount } },
            });

            await tx.notification.create({
                data: { recipientId: project.plannerId, type: 'NEW_PLEDGE', message: `${user.handleName}さんから支援がありました！`, projectId, linkUrl: `/projects/${projectId}` }
            });

            if (updatedProject.collectedAmount >= updatedProject.targetAmount && project.status !== 'SUCCESSFUL') {
                await tx.project.update({ where: { id: projectId }, data: { status: 'SUCCESSFUL' } });
                sendEmail(project.planner.email, '目標達成おめでとうございます', `<p>企画「${project.title}」が目標を達成しました！</p>`);
            }

            await checkUserLevelAndBadges(tx, userId);
            return { newPledge, project, user };
        });

        if (result) {
            const { project, user } = result;
            broadcastTicker(
                'pledge', 
                `${user.handleName}さんが『${project.title}』に支援しました！🎉`, 
                `/projects/${project.id}`
            );
            
            if (result.project.collectedAmount >= result.project.targetAmount && result.project.status === 'SUCCESSFUL') {
                broadcastTicker(
                    'goal', 
                    `🔥『${result.project.title}』が目標金額100%を達成しました！`, 
                    `/projects/${result.project.id}`
                );
            }
        }

        sendEmail(req.user.email, '支援完了のお知らせ', `<p>${pledgeAmount}ptの支援を完了しました。</p>`);
        res.status(201).json(result.newPledge); 
    } catch (error) {
        res.status(400).json({ message: error.message || '支援処理に失敗しました' });
    }
};

// ==========================================
// ★ ゲスト直接支援 (認証不要、現在は createCheckoutSession で統合可能ですが互換性のために残します)
// ==========================================
export const createGuestPledgeDirect = async (req, res) => {
    const { projectId, amount, comment, tierId, guestName, guestEmail } = req.body;
    if (!guestName || !guestEmail) return res.status(400).json({ message: 'お名前とメールアドレスは必須です' });

    try {
        const result = await prisma.$transaction(async (tx) => {
            const project = await tx.project.findUnique({ where: { id: projectId }, include: { planner: true } });
            if (!project) throw new Error('企画が見つかりません');
            if (project.status !== 'FUNDRAISING') throw new Error('募集中ではありません');

            let pledgeAmount = parseInt(amount, 10);
            if (tierId) {
                const tier = await tx.pledgeTier.findUnique({ where: { id: tierId } });
                if (tier) pledgeAmount = tier.amount;
            }

            const newPledge = await tx.pledge.create({
                data: { amount: pledgeAmount, projectId, userId: null, guestName, guestEmail, comment, pledgeTierId: tierId || null },
            });

            const updatedProject = await tx.project.update({
                where: { id: projectId },
                data: { collectedAmount: { increment: pledgeAmount } },
            });

            await tx.notification.create({
                data: { recipientId: project.plannerId, type: 'NEW_PLEDGE', message: `ゲストの${guestName}様から支援がありました`, projectId, linkUrl: `/projects/${projectId}` }
            });

            sendEmail(guestEmail, '【FLASTAL】支援完了のお知らせ', `<p>${project.title}への支援を承りました。</p>`);
            return { newPledge, project: updatedProject };
        });

        if (result) {
            broadcastTicker(
                'pledge', 
                `ゲストの${req.body.guestName}さんが『${result.project.title}』に支援しました！🎉`, 
                `/projects/${result.project.id}`
            );
        }

        res.status(201).json({ message: 'ゲスト支援完了', pledge: result.newPledge });
    } catch (error) {
        res.status(400).json({ message: error.message || 'エラーが発生しました' });
    }
};

// ==========================================
// ★ 履歴取得API
// ==========================================
export const getPaymentHistory = async (req, res) => {
    const userId = req.user.id;
    try {
        const pledges = await prisma.pledge.findMany({
            where: { userId: userId },
            include: { project: { select: { title: true } } },
            orderBy: { createdAt: 'desc' }
        });

        const history = pledges.map(p => ({
            id: `use_${p.id}`,
            type: 'USE',
            amount: p.amount,
            description: `『${p.project?.title || '企画'}』への支援`,
            createdAt: p.createdAt
        }));

        res.json(history);
    } catch (error) {
        console.error("History Error:", error);
        res.status(500).json({ message: '履歴の取得に失敗しました' });
    }
};