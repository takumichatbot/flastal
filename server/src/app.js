import express from 'express';
import compression from 'compression';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import webpush from 'web-push';
import { generalLimiter, authLimiter, uploadLimiter, paymentLimiter, aiLimiter } from './middleware/rateLimiter.js';
import postRoutes from './routes/posts.js';
import { sendEmail } from './utils/email.js';
import { startWebhookRetryJob } from './jobs/webhookRetry.js';
import { startReminderJob } from './jobs/reminderJob.js';
import { initSentry, Sentry } from './config/sentry.js';
import prisma from './config/prisma.js';
import { validateEnv } from './utils/validateEnv.js';
import { logger } from './utils/logger.js';

// 必須環境変数の確認（不足があれば即終了）
validateEnv();

// Sentryは環境変数確認後に初期化する
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
import liveRoutes          from './routes/live.js';
import orderChatRoutes     from './routes/orderChat.js';
import groupBuyRoutes      from './routes/groupBuy.js';
import templateRoutes      from './routes/templates.js';
import recommendRoutes     from './routes/recommend.js';
import feedRoutes          from './routes/feed.js';
import { metricsMiddleware, register } from './config/metrics.js';

// ★ 追加: Webhook、アップロード、認証関連、ユーザーコントローラーのインポート
import { handleStripeWebhook } from './controllers/webhookController.js';
import upload from './middleware/upload.js';
import { uploadImage } from './controllers/toolController.js';
import { authenticateToken } from './middleware/auth.js';
import * as userController from './controllers/userController.js'; // 🌟 追記: 通知用にインポート

const app = express();

// Renderなどのリバースプロキシ環境でX-Forwarded-Forを信頼
app.set('trust proxy', 1);

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
            if (process.env.NODE_ENV !== 'production') {
                logger.warn('CORS blocked', { origin });
            }
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
        const escapeHtml = (str) => String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        await sendEmail(
            "admin@flastal.com",
            `【お問い合わせ】${escapeHtml(name)}様より`,
            `<p>${escapeHtml(message)}</p><p>返信先: ${escapeHtml(email)}</p>`
        );
        res.json({ message: "お問い合わせを送信しました。" });
    } catch (e) {
        res.status(500).json({ message: "送信に失敗しました。" });
    }
});

// ==========================================
// ★★★ 標準ミドルウェア ★★★
// ==========================================
app.use(cookieParser());
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
// ★★★ ヘルスチェック ★★★
// ==========================================

// Liveness: プロセスが生きているか（rate limit なし）
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Readiness: DB接続が正常か（rate limit なし）
app.get('/api/readiness', async (_req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({
            status: 'ready',
            timestamp: new Date().toISOString(),
            db: 'connected',
        });
    } catch (err) {
        logger.error('Readiness check: DB connection failed', { error: err.message });
        res.status(503).json({
            status: 'not_ready',
            timestamp: new Date().toISOString(),
            db: 'disconnected',
            error: 'Database connection failed',
        });
    }
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
app.use('/api/live',                              generalLimiter, liveRoutes);
app.use('/api/group-buys',                        generalLimiter, groupBuyRoutes);
app.use('/api/order-chat',                        generalLimiter, orderChatRoutes);
app.use('/api/templates',                         generalLimiter, templateRoutes);
app.use('/api/recommend',                         generalLimiter, recommendRoutes);
app.use('/api/feed',                              generalLimiter, feedRoutes);
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
    logger.error('Server error', {
        method: req.method,
        url: req.url,
        bodyKeys: Object.keys(req.body || {}),
        stack: err.stack,
    });

    res.status(err.status || 500).json({
        message: 'サーバー側でエラーが発生しました。',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// cronジョブ起動
startWebhookRetryJob();
startReminderJob();
logger.info('Cron jobs started', { jobs: ['webhookRetry', 'reminder'] });

// 期限切れ自動キャンセル & 締切3日前リマインダーメール cron
import('./cron/deadlineChecker.js')
  .then(() => logger.info('Cron job loaded', { job: 'deadlineChecker' }))
  .catch((err) => logger.error('Failed to load deadlineChecker cron', { error: err.message }));

// グループ購入 締切未達時の自動返金 cron（毎時0分実行）
import('./cron/groupBuyRefund.js').then(({ runGroupBuyRefundJob }) => {
  setInterval(runGroupBuyRefundJob, 60 * 60 * 1000); // 毎時0分に実行
  runGroupBuyRefundJob(); // 起動時にも即実行
  logger.info('Cron job loaded', { job: 'groupBuyRefund', interval: '1h' });
}).catch((err) => logger.error('Failed to load groupBuyRefund cron', { error: err.message }));

// オファー期限切れ自動却下 cron（毎時実行）
import('./cron/offerExpiry.js').then(({ runOfferExpiryJob }) => {
  runOfferExpiryJob(); // 起動時に即実行
  setInterval(runOfferExpiryJob, 60 * 60 * 1000); // 毎時実行
  logger.info('Cron job loaded', { job: 'offerExpiry', interval: '1h' });
}).catch((err) => logger.error('Failed to load offerExpiry cron', { error: err.message }));

// 毎日9時（JST = UTC 0時）に通知ダイジェストメールを送信
import('./cron/notificationDigest.js').then(({ runNotificationDigestJob }) => {
  const now = new Date();
  const msUntilNextRun = (() => {
    const next = new Date(now);
    next.setUTCHours(0, 0, 0, 0); // UTC 0時 = JST 9時
    if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
    return next - now;
  })();
  setTimeout(() => {
    runNotificationDigestJob();
    setInterval(runNotificationDigestJob, 24 * 60 * 60 * 1000);
  }, msUntilNextRun);
  logger.info('Cron job loaded', { job: 'notificationDigest', schedule: 'daily UTC 00:00 (JST 09:00)' });
}).catch((err) => logger.error('Failed to load notificationDigest cron', { error: err.message }));

// BullMQ メールワーカー起動（REDIS_URL が設定されている場合のみ有効）
import('./queues/emailQueue.js')
  .then(({ startEmailWorker }) => {
    startEmailWorker();
    logger.info('BullMQ email worker started');
  })
  .catch(() => {
    logger.warn('BullMQ email worker not started (REDIS_URL may be unset)');
  });

// 期限切れリフレッシュトークン削除 cron（毎日4:00 JST = UTC 19:00）
import('./cron/cleanupExpiredTokens.js')
  .then(() => logger.info('Cron job loaded', { job: 'cleanupExpiredTokens', schedule: 'daily UTC 19:00 (JST 04:00)' }))
  .catch((err) => logger.error('Failed to load cleanupExpiredTokens cron', { error: err.message }));

// Typesense定期同期（毎朝UTC 17時 = JST 2時）
import('./cron/typesenseSync.js').then(({ runTypesenseSyncJob }) => {
  const scheduleDaily = () => {
    const now = new Date();
    const next = new Date(now);
    next.setUTCHours(17, 0, 0, 0); // UTC 17時 = JST 2時
    if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
    const delay = next - now;
    setTimeout(() => {
      runTypesenseSyncJob();
      setInterval(runTypesenseSyncJob, 24 * 60 * 60 * 1000);
    }, delay);
  };
  scheduleDaily();
  logger.info('Cron job loaded', { job: 'typesenseSync', schedule: 'daily UTC 17:00' });
}).catch(() => {});

export default app;