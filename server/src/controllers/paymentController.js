import PDFDocument from 'pdfkit';
import prisma from '../config/prisma.js';
import stripe from '../config/stripe.js';
import { queueEmail } from '../utils/email.js';
import { getIO } from '../config/socket.js';
import { evaluateAndAwardBadges } from '../utils/badges.js';
import { detectFraud } from '../utils/fraudDetection.js';
import { logger } from '../utils/logger.js';

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
        logger.warn('Socket emit failed', { context: 'paymentController', error: e.message });
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
        const idempotencyKey = `point-charge-${userId}-${amount}-${points}`;
        const session = await stripe.checkout.sessions.create(
            {
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
            },
            { idempotencyKey }
        );
        res.json({ url: session.url });
    } catch (error) {
        logger.error('Stripe Session Error (Points)', { context: 'paymentController', error: error.message });
        res.status(500).json({ message: 'セッション作成に失敗しました: ' + error.message });
    }
};

// ==========================================
// ★ 新規: 統合チェックアウトセッション (ハイブリッド決済対応)
// ==========================================
export const createCheckoutSession = async (req, res) => {
    const {
        projectId, amount, pointsToUse, cardAmount,
        comment, tierId, guestName, guestEmail, successUrl, cancelUrl,
        paymentMethod = 'card', refCode,
    } = req.body;

    const userId = req.user ? req.user.id : null;

    if (!cardAmount || cardAmount <= 0) {
        return res.status(400).json({ message: 'カード決済金額が無効です' });
    }

    // 対応する支払い方法タイプ
    const PM_TYPES = { card: ['card'], konbini: ['konbini'], paypay: ['paypay'] };
    const paymentMethodTypes = PM_TYPES[paymentMethod] || ['card'];

    try {
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project) return res.status(404).json({ message: '企画が見つかりません' });

        const sessionParams = {
            payment_method_types: paymentMethodTypes,
            line_items: [{
                price_data: {
                    currency: 'jpy',
                    product_data: {
                        name: `企画支援: ${project.title}`,
                        description: userId
                            ? `支援総額 ${amount}円 (ポイント充当: ${pointsToUse || 0}pt)`
                            : `ゲスト支援: ${guestName}様`,
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
            automatic_tax: { enabled: true },
            metadata: {
                type: 'pledge',
                projectId,
                userId: userId || 'guest',
                totalAmount: amount.toString(),
                pointsUsed: (pointsToUse || 0).toString(),
                cardAmount: cardAmount.toString(),
                tierId: tierId || 'none',
                comment: comment || '',
                guestName: guestName || '',
                guestEmail: guestEmail || '',
                refCode: refCode || '',
            },
            // コンビニ払いは支払い期限3日を設定
            ...(paymentMethod === 'konbini'
                ? { payment_method_options: { konbini: { expires_after_days: 3 } } }
                : {}),
        };

        const idempotencyKey = `checkout-${userId || 'guest'}-${projectId}-${cardAmount}-${paymentMethod}`;
        const session = await stripe.checkout.sessions.create(sessionParams, { idempotencyKey });
        res.json({ sessionUrl: session.url });
    } catch (error) {
        logger.error('Checkout Session Error', { context: 'paymentController', error: error.message });
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

            // 不正検知（非同期・ノンブロッキング）
            detectFraud(userId, projectId, pledgeAmount).catch(() => {});

            // ポイント減算と合計支援額の加算（アトミックな残高チェックで競合状態を防止）
            const pointsUpdated = await tx.user.updateMany({
                where: { id: userId, points: { gte: pledgeAmount } },
                data: { points: { decrement: pledgeAmount }, totalPledgedAmount: { increment: pledgeAmount } },
            });
            if (pointsUpdated.count === 0) {
                throw new Error('ポイント残高が不足しています。');
            }

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
            // プランナーへメール通知（支援受信）
            queueEmail(project.planner.email, 'PLEDGE_RECEIVED', {
                plannerName: project.planner.handleName || 'さん',
                projectTitle: project.title,
                amount: pledgeAmount.toLocaleString(),
                projectId,
            });

            if (updatedProject.collectedAmount >= updatedProject.targetAmount) {
                // WHERE句に status: 'FUNDRAISING' を含めることでべき等性を保証（二重更新防止）
                const promoted = await tx.project.updateMany({
                    where: { id: projectId, status: 'FUNDRAISING' },
                    data: { status: 'SUCCESSFUL' },
                });
                if (promoted.count > 0) {
                    queueEmail(project.planner.email, 'PROJECT_FUNDED', { plannerName: project.planner.handleName || 'さん', projectTitle: project.title, collectedAmount: updatedProject.collectedAmount.toLocaleString(), projectId });
                }
            }

            await checkUserLevelAndBadges(tx, userId);
            return { newPledge, project, user };
        });

        if (result) {
            const { project, user } = result;

            // バッジ評価（非同期・失敗しても無視）
            evaluateAndAwardBadges(userId).catch(() => {});

            // ── プロジェクトルームにリアルタイム更新を送信 ──────────────────────
            try {
                const updatedProject = await prisma.project.findUnique({
                    where: { id: projectId },
                    select: { collectedAmount: true, targetAmount: true },
                });
                const io = getIO();
                io.to(projectId).emit('pledgeUpdate', {
                    projectId,
                    collectedAmount: updatedProject.collectedAmount,
                    targetAmount:    updatedProject.targetAmount,
                    progress: updatedProject.targetAmount > 0
                        ? Math.round((updatedProject.collectedAmount / updatedProject.targetAmount) * 100)
                        : 0,
                    pledgerName:  user.handleName,
                    pledgeAmount,
                });
            } catch (e) {
                logger.warn('pledgeUpdate emit failed', { context: 'paymentController', error: e.message });
            }
            // ─────────────────────────────────────────────────────────────────────

            broadcastTicker(
                'pledge',
                `${user.handleName}さんが『${project.title}』に支援しました！🎉`,
                `/projects/${project.id}`
            );

            if (result.project.collectedAmount >= result.project.targetAmount && result.project.status === 'SUCCESSFUL') {
                try { getIO().to(projectId).emit('projectGoalReached', { projectId }); } catch (_) {}
                broadcastTicker(
                    'goal',
                    `🔥『${result.project.title}』が目標金額100%を達成しました！`,
                    `/projects/${result.project.id}`
                );
            }
        }

        queueEmail(req.user.email, 'PLEDGE_COMPLETED', { userName: req.user.handleName || 'さん', projectTitle: result.project.title, amount: pledgeAmount.toLocaleString(), projectId });
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

            queueEmail(guestEmail, 'PLEDGE_COMPLETED', { userName: guestName, projectTitle: project.title, amount: pledgeAmount.toLocaleString(), projectId });
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
        logger.error('History Error', { context: 'paymentController', error: error.message });
        res.status(500).json({ message: '履歴の取得に失敗しました' });
    }
};

// ==========================================
// ★ 領収書PDF生成・ダウンロード
// ==========================================
export const downloadReceipt = async (req, res) => {
    const { pledgeId } = req.params;
    const userId = req.user.id;

    try {
        const pledge = await prisma.pledge.findUnique({
            where: { id: pledgeId },
            include: {
                project: { select: { title: true, id: true } },
                user: { select: { id: true, handleName: true, email: true } },
            },
        });

        if (!pledge) return res.status(404).json({ message: '支援記録が見つかりません' });
        if (pledge.userId !== userId) return res.status(403).json({ message: 'アクセス権がありません' });

        const doc = new PDFDocument({ size: 'A4', margin: 60 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="receipt_${pledgeId}.pdf"`);
        doc.pipe(res);

        // ヘッダー
        doc.fontSize(22).font('Helvetica-Bold').text('FLASTAL', { align: 'center' });
        doc.fontSize(12).font('Helvetica').text('Receipt / 領収書', { align: 'center' });
        doc.moveDown(1.5);

        // 区切り線
        doc.moveTo(60, doc.y).lineTo(535, doc.y).stroke('#e2e8f0');
        doc.moveDown(1);

        // 本文
        const rows = [
            ['領収書番号', pledgeId],
            ['発行日', new Date().toLocaleDateString('ja-JP')],
            ['支援日', new Date(pledge.createdAt).toLocaleDateString('ja-JP')],
            ['支援先企画', pledge.project?.title || '-'],
            ['支援者名', pledge.user?.handleName || pledge.guestName || '-'],
            ['支援者メール', pledge.user?.email || pledge.guestEmail || '-'],
            ['支援金額', `${pledge.amount.toLocaleString()} pt / ¥${pledge.amount.toLocaleString()}`],
        ];

        rows.forEach(([label, value]) => {
            doc.fontSize(10).font('Helvetica-Bold').text(label, 60, doc.y, { continued: true, width: 160 });
            doc.font('Helvetica').text(value, { align: 'left' });
            doc.moveDown(0.4);
        });

        doc.moveDown(1.5);
        doc.moveTo(60, doc.y).lineTo(535, doc.y).stroke('#e2e8f0');
        doc.moveDown(1);
        doc.fontSize(9).fillColor('#94a3b8').text(
            'このPDFは自動発行された領収書です。FLASTAL（flastal.com）は本支援取引の証明として発行しています。',
            { align: 'center' }
        );

        doc.end();
    } catch (err) {
        logger.error('downloadReceipt Error', { context: 'paymentController', error: err.message });
        if (!res.headersSent) res.status(500).json({ message: 'PDF生成に失敗しました' });
    }
};

// ==========================================
// ★ インボイス PDF 発行（適格請求書対応）
// ==========================================
export const downloadInvoice = async (req, res) => {
    const { pledgeId } = req.params;
    const userId = req.user.id;

    try {
        const pledge = await prisma.pledge.findUnique({
            where: { id: pledgeId },
            include: {
                project: { select: { title: true } },
                user: { select: { handleName: true, email: true } },
            },
        });

        if (!pledge) return res.status(404).json({ message: '支援記録が見つかりません' });
        if (pledge.userId !== userId) return res.status(403).json({ message: 'アクセス権がありません' });

        const TAX_RATE = 0.10;
        const baseAmount = Math.round(pledge.amount / (1 + TAX_RATE));
        const taxAmount = pledge.amount - baseAmount;
        const invoiceNo = `INV-${new Date(pledge.createdAt).getFullYear()}-${pledgeId.slice(-8).toUpperCase()}`;

        const doc = new PDFDocument({ size: 'A4', margin: 60 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="invoice_${pledgeId}.pdf"`);
        doc.pipe(res);

        doc.fontSize(20).font('Helvetica-Bold').text('INVOICE / 適格請求書', { align: 'center' });
        doc.fontSize(9).font('Helvetica').fillColor('#64748b').text(`登録番号: ${process.env.INVOICE_REGISTRATION_NUMBER || 'T0000000000000'}`, { align: 'center' });
        doc.fillColor('#000000').moveDown(1.5);
        doc.moveTo(60, doc.y).lineTo(535, doc.y).stroke('#e2e8f0').moveDown(1);

        const rows = [
            ['インボイス番号', invoiceNo],
            ['発行日', new Date().toLocaleDateString('ja-JP')],
            ['支援日', new Date(pledge.createdAt).toLocaleDateString('ja-JP')],
            ['請求先', pledge.user?.handleName || pledge.guestName || '-'],
            ['メールアドレス', pledge.user?.email || pledge.guestEmail || '-'],
            ['対象企画', pledge.project?.title || '-'],
        ];
        rows.forEach(([label, value]) => {
            doc.fontSize(10).font('Helvetica-Bold').text(label, 60, doc.y, { continued: true, width: 160 });
            doc.font('Helvetica').text(value);
            doc.moveDown(0.4);
        });

        doc.moveDown(1);
        doc.moveTo(60, doc.y).lineTo(535, doc.y).stroke('#e2e8f0').moveDown(0.5);
        doc.fontSize(10).font('Helvetica-Bold').text('税抜金額', 60, doc.y, { continued: true, width: 200 });
        doc.font('Helvetica').text(`¥${baseAmount.toLocaleString()}`);
        doc.font('Helvetica-Bold').text('消費税（10%）', 60, doc.y, { continued: true, width: 200 });
        doc.font('Helvetica').text(`¥${taxAmount.toLocaleString()}`);
        doc.font('Helvetica-Bold').text('合計（税込）', 60, doc.y, { continued: true, width: 200 });
        doc.font('Helvetica').text(`¥${pledge.amount.toLocaleString()}`);
        doc.moveDown(1.5);
        doc.moveTo(60, doc.y).lineTo(535, doc.y).stroke('#e2e8f0').moveDown(1);
        doc.fontSize(9).fillColor('#94a3b8').text(
            '本書はFLASTAL（flastal.com）が発行する適格請求書（インボイス）の控えです。',
            { align: 'center' }
        );
        doc.end();
    } catch (err) {
        logger.error('downloadInvoice Error', { context: 'paymentController', error: err.message });
        if (!res.headersSent) res.status(500).json({ message: 'インボイス生成に失敗しました' });
    }
};

// ==========================================
// ★ 月次サポーター (Stripe Subscription)
// ==========================================
export const createSubscriptionSession = async (req, res) => {
    const { projectId, amount, tierId, successUrl, cancelUrl } = req.body;
    const userId = req.user.id;

    if (!amount || amount < 100) return res.status(400).json({ message: '月額は100円以上指定してください' });

    try {
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project) return res.status(404).json({ message: '企画が見つかりません' });

        // Stripe に都度 Price を作成（recurring monthly）
        const priceIdempotencyKey = `sub-price-${userId}-${projectId}-${amount}`;
        const price = await stripe.prices.create(
            {
                currency: 'jpy',
                unit_amount: parseInt(amount),
                recurring: { interval: 'month' },
                product_data: { name: `月次サポーター: ${project.title}` },
            },
            { idempotencyKey: priceIdempotencyKey }
        );

        const sessionIdempotencyKey = `sub-session-${userId}-${projectId}-${amount}`;
        const session = await stripe.checkout.sessions.create(
            {
                payment_method_types: ['card'],
                line_items: [{ price: price.id, quantity: 1 }],
                mode: 'subscription',
                success_url: successUrl,
                cancel_url: cancelUrl,
                customer_email: req.user.email,
                client_reference_id: userId,
                metadata: {
                    type: 'subscription',
                    projectId,
                    userId,
                    tierId: tierId || 'none',
                    amount: String(amount),
                },
            },
            { idempotencyKey: sessionIdempotencyKey }
        );

        res.json({ sessionUrl: session.url });
    } catch (error) {
        logger.error('Subscription Session Error', { context: 'paymentController', error: error.message });
        res.status(500).json({ message: 'サブスクリプションセッション作成に失敗しました' });
    }
};

// Stripe が subscription.* イベントを送るときの処理
export const handleSubscriptionWebhook = async (subscriptionObj, eventType) => {
    const meta = subscriptionObj.metadata || {};
    const { type, projectId, userId, tierId, amount } = meta;

    // プレミアムプランの処理
    if (type === 'premium_subscription' && userId) {
        if (eventType === 'customer.subscription.created') {
            const until = new Date();
            until.setMonth(until.getMonth() + 1);
            await prisma.user.update({
                where: { id: userId },
                data: { isPremium: true, premiumUntil: until, premiumStripeSubId: subscriptionObj.id },
            });
        }
        if (eventType === 'customer.subscription.deleted') {
            await prisma.user.update({
                where: { id: userId },
                data: { isPremium: false, premiumStripeSubId: null },
            });
        }
        return;
    }

    if (!projectId || !userId) return;

    if (eventType === 'customer.subscription.created') {
        await prisma.pledge.create({
            data: {
                projectId,
                userId,
                pledgeTierId: tierId !== 'none' ? tierId : null,
                amount: parseInt(amount) || 0,
                subscriptionId: subscriptionObj.id,
                subscriptionStatus: 'active',
                comment: '月次サポーター',
            },
        });
        const [user, proj] = await Promise.all([
            prisma.user.findUnique({ where: { id: userId }, select: { email: true, handleName: true } }),
            prisma.project.findUnique({ where: { id: projectId }, select: { title: true } }),
        ]);
        if (user?.email) queueEmail(user.email, 'SUBSCRIPTION_STARTED', { userName: user.handleName || 'さん', projectTitle: proj?.title || '', amount });
    }

    if (eventType === 'customer.subscription.deleted') {
        await prisma.pledge.updateMany({
            where: { subscriptionId: subscriptionObj.id },
            data: { subscriptionStatus: 'canceled' },
        });
    }

    if (eventType === 'invoice.payment_failed') {
        const subId = subscriptionObj.subscription;
        if (subId) {
            await prisma.pledge.updateMany({
                where: { subscriptionId: subId },
                data: { subscriptionStatus: 'past_due' },
            });
        }
    }
};
// ==========================================
// ★ 定期支援: マイサブスクリプション取得・キャンセル
// ==========================================
export const getMySubscriptions = async (req, res) => {
    const userId = req.user.id;
    try {
        const subs = await prisma.pledge.findMany({
            where: { userId, subscriptionId: { not: null } },
            select: {
                id: true, amount: true, subscriptionId: true, subscriptionStatus: true,
                createdAt: true,
                project: { select: { id: true, title: true, imageUrl: true } },
            },
            distinct: ['subscriptionId'],
            orderBy: { createdAt: 'desc' },
        });
        res.json(subs);
    } catch (err) {
        logger.error('getMySubscriptions', { context: 'paymentController', error: err.message });
        res.status(500).json({ message: '取得に失敗しました' });
    }
};

export const cancelSubscription = async (req, res) => {
    const { subscriptionId } = req.params;
    const userId = req.user.id;
    try {
        const pledge = await prisma.pledge.findFirst({
            where: { subscriptionId, userId },
        });
        if (!pledge) return res.status(403).json({ message: '権限がありません' });

        await stripe.subscriptions.cancel(subscriptionId);

        await prisma.pledge.updateMany({
            where: { subscriptionId },
            data: { subscriptionStatus: 'canceled' },
        });

        res.json({ message: '定期支援をキャンセルしました' });
    } catch (err) {
        logger.error('cancelSubscription', { context: 'paymentController', error: err.message });
        res.status(500).json({ message: 'キャンセルに失敗しました' });
    }
};

// ==========================================
// ★ プレミアムプラン (月額 980円)
// ==========================================
const PREMIUM_PRICE_JPY = 980;

export const createPremiumSession = async (req, res) => {
    const userId = req.user.id;
    const frontendUrl = req.headers.origin || process.env.FRONTEND_URL || 'https://www.flastal.com';
    try {
        const idempotencyKey = `premium-session-${userId}`;
        const session = await stripe.checkout.sessions.create(
            {
                payment_method_types: ['card'],
                line_items: [{
                    price_data: {
                        currency: 'jpy',
                        product_data: { name: 'FLASTAL プレミアムプラン', description: '詳細アナリティクス・優先掲載・AIカバー無制限' },
                        unit_amount: PREMIUM_PRICE_JPY,
                        recurring: { interval: 'month' },
                    },
                    quantity: 1,
                }],
                mode: 'subscription',
                success_url: `${frontendUrl}/mypage?premium=success`,
                cancel_url:  `${frontendUrl}/premium`,
                client_reference_id: userId,
                metadata: { type: 'premium_subscription', userId },
            },
            { idempotencyKey }
        );
        res.json({ url: session.url });
    } catch (err) {
        logger.error('createPremiumSession', { context: 'paymentController', error: err.message });
        res.status(500).json({ message: 'セッション作成に失敗しました' });
    }
};

export const cancelPremiumSubscription = async (req, res) => {
    const userId = req.user.id;
    try {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { premiumStripeSubId: true } });
        if (!user?.premiumStripeSubId) return res.status(400).json({ message: 'プレミアムサブスクリプションが見つかりません' });
        await stripe.subscriptions.cancel(user.premiumStripeSubId);
        await prisma.user.update({ where: { id: userId }, data: { isPremium: false, premiumStripeSubId: null } });
        res.json({ message: 'プレミアムプランをキャンセルしました' });
    } catch (err) {
        res.status(500).json({ message: 'キャンセルに失敗しました' });
    }
};
