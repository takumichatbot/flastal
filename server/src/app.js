import express from 'express';
import cors from 'cors';
import Stripe from 'stripe'; 
import webpush from 'web-push';
import prisma from './config/prisma.js';
import { sendEmail } from './utils/email.js';
import { createNotification } from './utils/notification.js';

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
    origin: (origin, callback) => {
        // originがundefined（同一ドメインやツールからのリクエスト）または許可リストにある場合
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked for origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
        "Content-Type", 
        "Authorization", 
        "X-Requested-With", 
        "Accept", 
        "Origin",
        "Cache-Control"
    ],
    exposedHeaders: ["Authorization"] // クライアントがヘッダーを読み取れるように明示
}));

// ==========================================
// ★★★ ヘルパー関数 (Webhook用) ★★★
// ==========================================
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
    }
}

// ==========================================
// ★★★ Stripe Webhook (JSONパース前に配置が必要) ★★★
// ==========================================
app.post('/api/webhooks/stripe', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;
    
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    const session = event.data.object;
    
    if (event.type === 'checkout.session.completed') {
        const userId = session.client_reference_id;
        const amount = session.amount_total;

        if (session.metadata && session.metadata.isGuestPledge === 'true') {
            const { projectId, tierId, comment, guestName, guestEmail } = session.metadata;

            try {
                await prisma.$transaction(async (tx) => {
                    const newPledge = await tx.pledge.create({
                        data: {
                            amount: amount, 
                            projectId: projectId,
                            userId: null,
                            guestName: guestName,
                            guestEmail: guestEmail,
                            comment: comment,
                            pledgeTierId: tierId !== 'none' ? tierId : null,
                            stripePaymentIntentId: session.payment_intent
                        },
                    });

                    const updatedProject = await tx.project.update({
                        where: { id: projectId },
                        data: { collectedAmount: { increment: amount } },
                        include: { planner: true }
                    });

                    await createNotification(
                        updatedProject.plannerId,
                        'NEW_PLEDGE',
                        `ゲストの ${guestName} 様から ${amount.toLocaleString()}円 の支援がありました！`,
                        projectId,
                        `/projects/${projectId}`
                    );

                    if (updatedProject.collectedAmount >= updatedProject.targetAmount && updatedProject.status !== 'SUCCESSFUL') {
                        await tx.project.update({
                            where: { id: projectId },
                            data: { status: 'SUCCESSFUL' },
                        });
                        sendEmail(updatedProject.planner.email, '【FLASTAL】目標金額達成のお祝い', `<p>企画「${updatedProject.title}」が目標を達成しました！</p>`);
                    }
                });
            } catch (error) {
                console.error(`[Webhook Error] Guest pledge failed:`, error);
            }
        } 
        else if (userId) { 
            const pointsPurchased = parseInt(session.metadata.points) || amount;
            try {
                await prisma.$transaction(async (tx) => {
                    const purchaser = await tx.user.findUnique({ where: { id: userId } });
                    if (purchaser) {
                        await tx.user.update({ where: { id: userId }, data: { points: { increment: pointsPurchased } } });
                        if (!purchaser.hasMadeFirstPurchase && purchaser.referredById) {
                            await tx.user.update({ where: { id: purchaser.referredById }, data: { points: { increment: 500 } } });
                            await tx.user.update({ where: { id: userId }, data: { hasMadeFirstPurchase: true } });
                        }
                        await checkUserLevelAndBadges(tx, userId);
                    }
                });
            } catch(error) {
                console.error(`[Webhook Error] Point purchase failed:`, error);
            }
        }
    }
    res.json({ received: true });
});

// ==========================================
// ★★★ 標準ミドルウェア ★★★
// ==========================================
app.use(express.json());

app.get('/', (req, res) => {
    res.send('FLASTAL API Server is running (v2)');
});

// ==========================================
// ★★★ ルーティングのマウント ★★★
// ==========================================

// 認証・ユーザー基本
app.use('/api', authRoutes);
app.use('/api', userRoutes);

// 花屋関連
app.use('/api/florists', floristRoutes);

// 会場・企画関連
app.use('/api/projects', projectRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/project-details', projectDetailRoutes);

// ツール・決済
app.use('/api/tools', toolRoutes);
app.use('/api/payment', paymentRoutes);

// 管理者
app.use('/api/admin', adminRoutes);

export default app;