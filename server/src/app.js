import express from 'express';
import cors from 'cors';
import Stripe from 'stripe'; 
import webpush from 'web-push';
import prisma from './config/prisma.js';
import { sendEmail } from './utils/email.js';
import { createNotification } from './utils/notification.js'; // ★共通化した通知機能をインポート

// --- ルーティングファイルのインポート ---
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import userRoutes from './routes/users.js';
import floristRoutes from './routes/florists.js';
import venueRoutes from './routes/venues.js';
import toolRoutes from './routes/tools.js';
import adminRoutes from './routes/admin.js';
import paymentRoutes from './routes/payment.js';
import projectDetailRoutes from './routes/projectDetails.js';

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ==========================================
// ★★★ Push通知 (VAPID) 設定 ★★★
// ==========================================
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        'mailto:info@flastal.com',
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
    console.log('VAPID keys set successfully.');
}

// ==========================================
// ★★★ CORS設定 ★★★
// ==========================================
const allowedOrigins = [
    'http://localhost:3000',
    process.env.FRONTEND_URL,
    'https://www.flastal.com',
    'https://flastal.com',
    'https://flastal-frontend.onrender.com'
].filter(Boolean);

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
}));

// ==========================================
// ★★★ ヘルパー関数 (Webhook用) ★★★
// ==========================================

// ユーザーレベル計算 (レベルアップ判定)
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
        await tx.user.update({
            where: { id: userId },
            data: { supportLevel: newLevel },
        });
        // レベルアップ通知（トランザクション外で実行するためここではログのみ）
        console.log(`User ${userId} leveled up to ${newLevel}`);
    }
}

// ==========================================
// ★★★ Stripe Webhook (JSONパース前に配置) ★★★
// ==========================================
// ※ StripeからのリクエストはRaw Bodyで署名検証する必要があるため、express.json()より前に置きます
app.post('/api/webhooks/stripe', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;
    
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.log(`Webhook signature verification failed.`, err.message);
        return res.sendStatus(400);
    }
    
    const session = event.data.object;
    
    if (event.type === 'checkout.session.completed') {
        const userId = session.client_reference_id; // 会員ID
        const amount = session.amount_total; // 支払金額

        // -------------- 🅰️ ゲスト支援の処理 --------------
        if (session.metadata && session.metadata.isGuestPledge === 'true') {
            const { projectId, tierId, comment, guestName, guestEmail } = session.metadata;
            console.log(`[Webhook] Processing Guest Pledge for Project: ${projectId}`);

            try {
                // 1. 支援レコード作成
                const newPledge = await prisma.pledge.create({
                    data: {
                        amount: amount, 
                        projectId: projectId,
                        userId: null, // ゲスト
                        guestName: guestName,
                        guestEmail: guestEmail,
                        comment: comment,
                        pledgeTierId: tierId !== 'none' ? tierId : null,
                        stripePaymentIntentId: session.payment_intent
                    },
                });

                // 2. 企画の集計金額更新 & 企画者取得
                const updatedProject = await prisma.project.update({
                    where: { id: projectId },
                    data: { collectedAmount: { increment: amount } },
                    include: { planner: true }
                });

                // 3. 企画者に通知 (共通関数を使用)
                await createNotification(
                    updatedProject.plannerId,
                    'NEW_PLEDGE',
                    `ゲストの ${guestName} 様から ${amount.toLocaleString()}円 の支援がありました！`,
                    projectId,
                    `/projects/${projectId}`
                );

                // 4. 目標達成チェック
                if (updatedProject.collectedAmount >= updatedProject.targetAmount && updatedProject.status !== 'SUCCESSFUL') {
                    await prisma.project.update({
                        where: { id: projectId },
                        data: { status: 'SUCCESSFUL' },
                    });
                    const successEmailContent = `
                        <p>${updatedProject.planner.handleName} 様</p>
                        <p>おめでとうございます！企画「${updatedProject.title}」が目標金額を達成しました！</p>
                    `;
                    sendEmail(updatedProject.planner.email, '【FLASTAL】目標金額達成のお祝い', successEmailContent);
                }
                console.log(`[Webhook] Guest pledge saved. ID: ${newPledge.id}`);

            } catch (error) {
                console.error(`[Webhook Error] Failed to save guest pledge:`, error);
            }
        } 
        // -------------- 🅱️ ポイント購入の処理 (会員) --------------
        else if (userId) { 
            const pointsPurchased = parseInt(session.metadata.points) || amount;
            try {
                const purchaser = await prisma.user.findUnique({ where: { id: userId } });
                if (purchaser) {
                    await prisma.$transaction(async (tx) => {
                        await tx.user.update({ where: { id: userId }, data: { points: { increment: pointsPurchased } } });
                        // 初回購入ボーナス (紹介者へ)
                        if (!purchaser.hasMadeFirstPurchase && purchaser.referredById) {
                            await tx.user.update({ where: { id: purchaser.referredById }, data: { points: { increment: 500 } } });
                            await tx.user.update({ where: { id: userId }, data: { hasMadeFirstPurchase: true } });
                        }
                        await checkUserLevelAndBadges(tx, userId);
                    });
                    console.log(`[Webhook] User ${userId} purchased ${pointsPurchased} points.`);
                }
            } catch(error) {
                console.error(`[Webhook Error] Point purchase failed:`, error);
            }
        }
    }
    
    res.status(200).json({ received: true });
});

// ==========================================
// ★★★ 標準ミドルウェア ★★★
// ==========================================
app.use(express.json()); // JSONボディパース

// ルート定義 (ヘルスチェック用)
app.get('/', (req, res) => {
    res.send('FLASTAL API Server is running (v2)');
});

// ==========================================
// ★★★ ルーティングのマウント ★★★
// ==========================================

// admin以外は、各ルーターファイル内でパスプレフィックス（/projectsなど）を
// 定義しているため、ここでは '/api' 直下にマウントします。

app.use('/api', authRoutes);          // /api/users/login 等
app.use('/api', projectRoutes);       // /api/projects 等
app.use('/api', userRoutes);          // /api/users/..., /api/notifications 等
app.use('/api', floristRoutes);       // /api/florists/..., /api/offers 等
app.use('/api', venueRoutes);         // /api/venues/..., /api/events 等
app.use('/api', toolRoutes);          // /api/ai/..., /api/push/... 等
app.use('/api', paymentRoutes);       // /api/pledges, /api/checkout 等
app.use('/api', projectDetailRoutes); // /api/tasks, /api/reviews 等

// ★ adminRoutesのみ、ファイル内でプレフィックスを省略しているので、ここで階層をつける
app.use('/api/admin', adminRoutes);   // /api/admin/projects/pending 等

export default app;