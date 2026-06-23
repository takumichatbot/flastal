import { vi } from 'vitest';

// Prisma をモック
vi.mock('../config/prisma.js', () => ({
    default: {
        user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), findMany: vi.fn(), updateMany: vi.fn() },
        project: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
        pledge: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
        florist: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
        notification: { findMany: vi.fn(), create: vi.fn() },
        pushSubscription: { findMany: vi.fn(), create: vi.fn(), delete: vi.fn() },
        webhookLog: { findUnique: vi.fn(), upsert: vi.fn(), create: vi.fn() },
        pledgeTier: { findUnique: vi.fn() },
        $transaction: vi.fn((fn) => fn({
            user: { create: vi.fn(), update: vi.fn(), findUnique: vi.fn(), updateMany: vi.fn() },
            project: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
            pledge: { create: vi.fn(), count: vi.fn() },
            pledgeTier: { findUnique: vi.fn() },
            notification: { create: vi.fn() },
        })),
    },
}));

// メール送信をモック
vi.mock('../utils/email.js', () => ({
    sendDynamicEmail: vi.fn(),
    queueEmail: vi.fn(),
}));

// Sentry をモック
vi.mock('../config/sentry.js', () => ({
    initSentry: vi.fn(),
    Sentry: { expressErrorHandler: () => (_err, _req, _res, next) => next(_err) },
}));

// ioredis / cache はそのまま（インメモリ実装のため不要）
