import express from 'express';
import compression from 'compression';
import cors from 'cors';
import webpush from 'web-push';
import { generalLimiter, authLimiter, uploadLimiter, paymentLimiter, aiLimiter } from './middleware/rateLimiter.js';
import postRoutes from './routes/posts.js';
import { sendEmail } from './utils/email.js';
import { startWebhookRetryJob } from './jobs/webhookRetry.js';
import { startReminderJob } from './jobs/reminderJob.js';
import { initSentry, Sentry } from './config/sentry.js';

// Sentryは最初に初期化する
initSentry();

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
import illustratorRoutes from './routes/illustrators.js';
import discussionRoutes from './routes/discussions.js';
import projectUpdateRoutes from './routes/projectUpdates.js';
import stretchGoalRoutes   from './routes/stretchGoals.js';
import teamRoutes          from './routes/team.js';
import artistPageRoutes    from './routes/artistPages.js';
import giftCardRoutes      from './routes/giftCards.js';
import galleryRoutes       from './routes/gallery.js';
import shopRoutes          from './routes/shop.js';
import { metricsMiddleware, register } from './config/metrics.js';

// ★ 追加: Webhook、アップロード、認証関連、ユーザーコントローラーのインポート
import { handleStripeWebhook } from './controllers/webhookController.js';
import upload from './middleware/upload.js';
import { uploadImage } from './controllers/toolController.js';
import { authenticateToken } from './middleware/auth.js';
import * as userController from './controllers/userController.js'; // 🌟 追記: 通知用にインポート

const app = express();

// ==========================================
// ★★★ gzip圧縮 ★★★
// ==========================================
app.use(compression());

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
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], // 🌟 "PUT" を追加！
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
app.post('/api/webhooks/stripe', express.raw({type: 'application/json'}), handleStripeWebhook);

// お問い合わせフォーム
app.post('/api/contact', async (req, res) => {
    const { name, email, message } = req.body;
    try {
        await sendEmail("admin@flastal.com", `【お問い合わせ】${name}様より`, `<p>${message}</p><p>返信先: ${email}</p>`);
        res.json({ message: "お問い合わせを送信しました。" });
    } catch (e) {
        res.status(500).json({ message: "送信に失敗しました。" });
    }
});

// ==========================================
// ★★★ 標準ミドルウェア ★★★
// ==========================================
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(metricsMiddleware);

// Prometheus メトリクスエンドポイント（Grafana Agent が scrape）
app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

app.get('/', (_req, res) => {
    res.send('FLASTAL API Server is running (v2)');
});

// ==========================================
// ★★★ ルーティングのマウント ★★★
// ==========================================
app.use('/api', authLimiter, authRoutes);       // ログイン・登録は厳しく制限
app.use('/api/users', generalLimiter, userRoutes);
app.use('/api/florists', generalLimiter, floristRoutes);
app.use('/api/venues', generalLimiter, venueRoutes);
app.use('/api/events', generalLimiter, eventRoutes);
app.use('/api/projects', generalLimiter, projectRoutes);
app.use('/api/project-details', generalLimiter, projectDetailRoutes);
app.use('/api/organizers', generalLimiter, organizerRoutes);
app.use('/api/illustrators', generalLimiter, illustratorRoutes);
app.use('/api/projects/:projectId/discussions', generalLimiter, discussionRoutes);
app.use('/api/projects/:projectId/updates',      generalLimiter, projectUpdateRoutes);
app.use('/api/projects/:projectId/stretch-goals', generalLimiter, stretchGoalRoutes);
app.use('/api/projects/:projectId/team',          generalLimiter, teamRoutes);
app.use('/api/artists',                           generalLimiter, artistPageRoutes);
app.use('/api/gift-cards',                        generalLimiter, giftCardRoutes);
app.use('/api/gallery',                           generalLimiter, galleryRoutes);
app.use('/api/shop',                              generalLimiter, shopRoutes);
app.use('/api/tools', uploadLimiter, toolRoutes); // S3アップロード・AI生成
app.use('/api/ai', aiLimiter, toolRoutes);
app.use('/api/payment', paymentLimiter, paymentRoutes);
app.use('/api/admin', generalLimiter, adminRoutes);
app.use('/api/posts', generalLimiter, postRoutes);

// ★★★ 画像アップロード用の汎用エンドポイント ★★★
app.post('/api/upload', uploadLimiter, authenticateToken, upload.single('image'), uploadImage);

// 🌟 追記: フロントエンドからの通知取得URL(/api/notifications)の受け皿
app.get('/api/notifications', authenticateToken, userController.getNotifications);
app.patch('/api/notifications/:notificationId/read', authenticateToken, userController.markNotificationRead);
app.patch('/api/notifications/read-all', authenticateToken, userController.markAllNotificationsRead);


// 404ハンドラー
app.use((_req, res) => {
    res.status(404).json({ message: "Requested route not found" });
});

// Sentryエラーハンドラー（エラーを捕捉してSentryへ送信）
app.use(Sentry.expressErrorHandler());

// エラーハンドリングミドルウェア
app.use((err, req, res, _next) => {
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

// cronジョブ起動
startWebhookRetryJob();
startReminderJob();
// 期限切れ自動キャンセル & 締切3日前リマインダーメール cron
import('./cron/deadlineChecker.js').catch(console.error);

// BullMQ メールワーカー起動（REDIS_URL が設定されている場合のみ有効）
import('./queues/emailQueue.js').then(({ startEmailWorker }) => startEmailWorker()).catch(() => {});

export default app;