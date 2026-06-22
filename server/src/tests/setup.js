import { vi } from 'vitest';

// Prisma をモック
vi.mock('../config/prisma.js', () => ({
    default: {
        user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), findMany: vi.fn() },
        project: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
        pledge: { findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
        florist: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
        notification: { findMany: vi.fn(), create: vi.fn() },
        $transaction: vi.fn((fn) => fn({
            user: { create: vi.fn(), update: vi.fn() },
            pledge: { create: vi.fn() },
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
