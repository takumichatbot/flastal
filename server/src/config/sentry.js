import * as Sentry from '@sentry/node';

export function initSentry() {
    const dsn = process.env.SENTRY_DSN;
    if (!dsn) {
        console.warn('[Sentry] SENTRY_DSN が未設定のため無効化されています');
        return;
    }
    Sentry.init({
        dsn,
        environment: process.env.NODE_ENV || 'production',
        tracesSampleRate: 0.2,
        // Prisma クエリはノイジーなので除外
        integrations: [Sentry.prismaIntegration()],
    });
    console.log('[Sentry] 初期化完了');
}

export { Sentry };
