import express from 'express';
import cors from 'cors';
import Stripe from 'stripe'; 
import webpush from 'web-push';
import prisma from './config/prisma.js';
import postRoutes from './routes/posts.js';
import { sendEmail } from './utils/email.js';
import { createNotification } from './utils/notification.js';

// --- ルーティングファイルのインポート ---
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import userRoutes from './routes/users.js';
import floristRoutes from './routes/florists.js';
import venueRoutes from './routes/venues.js';
import eventRoutes from './routes/events.js'; 
import toolRoutes from './routes/tools.js';
import adminRoutes from './routes/admin.js';
import paymentRoutes from './routes/payment.js';
import projectDetailRoutes from './routes/projectDetails.js';
import organizerRoutes from './routes/organizers.js';

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
    exposedHeaders: ["Authorization"]
}));

// ==========================================
// ★★★ Stripe Webhook (JSONパース前に配置) ★★★
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
    
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const userId = session.client_reference_id;
        const amount = session.amount_total;

        if (session.metadata && session.metadata.isGuestPledge === 'true') {
            const { projectId, tierId, comment, guestName, guestEmail } = session.metadata;
            try {
                await prisma.$transaction(async (tx) => {
                    await tx.pledge.create({
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
                });
            } catch (error) {
                console.error(`[Webhook Error] Guest pledge failed:`, error);
            }
        } else if (userId) {
            try {
                const pointsPurchased = parseInt(session.metadata.points) || amount;
                await prisma.user.update({ where: { id: userId }, data: { points: { increment: pointsPurchased } } });
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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/', (req, res) => {
    res.send('FLASTAL API Server is running (v2)');
});

// ==========================================
// ★★★ ルーティングのマウント ★★★
// ==========================================
app.use('/api', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/florists', floristRoutes);
app.use('/api/venues', venueRoutes); 
app.use('/api/events', eventRoutes); 
app.use('/api/projects', projectRoutes);
app.use('/api/project-details', projectDetailRoutes);
app.use('/api/organizers', organizerRoutes);
app.use('/api/tools', toolRoutes);
app.use('/api/ai', toolRoutes); // ★ 追加：フロントエンドの /api/ai/... リクエストに対応
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/posts', postRoutes);

// 404ハンドラー
app.use((req, res) => {
    res.status(404).json({ message: "Requested route not found" });
});

// エラーハンドリングミドルウェア
app.use((err, req, res, next) => {
    console.error('--- SERVER ERROR ---');
    console.error('Method:', req.method);
    console.error('URL:', req.url);
    console.error('Body Keys:', Object.keys(req.body || {}));
    console.error('Error Stack:', err.stack);
    
    res.status(err.status || 500).json({
        message: 'サーバー側でエラーが発生しました。',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

export default app;