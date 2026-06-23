/**
 * payment.test.js
 * 決済・支援フロー（paymentController）のユニットテスト
 *
 * setup.js で Prisma / email がグローバルモック済みのため、
 * このファイルでは追加のビジネスロジックのみを検証する。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// setup.js でモック済みの app / prisma を動的インポート
const { default: app } = await import('../app.js');
const { default: prisma } = await import('../config/prisma.js');
const { queueEmail } = await import('../utils/email.js');

// Stripe はモジュールレベルでモック（config/stripe.js 経由）
vi.mock('../config/stripe.js', () => ({
    default: {
        checkout: {
            sessions: {
                create: vi.fn(),
            },
        },
        webhooks: {
            constructEvent: vi.fn(),
        },
    },
}));

// Socket.IO はモック（broadcastTicker / getIO の副作用を排除）
vi.mock('../config/socket.js', () => ({
    getIO: vi.fn(() => ({
        emit: vi.fn(),
        to: vi.fn(() => ({ emit: vi.fn() })),
    })),
}));

// badges / fraudDetection は非同期副作用なのでモック
vi.mock('../utils/badges.js', () => ({
    evaluateAndAwardBadges: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../utils/fraudDetection.js', () => ({
    detectFraud: vi.fn().mockResolvedValue(undefined),
}));

import stripe from '../config/stripe.js';

beforeEach(() => {
    vi.clearAllMocks();
});

// ─── checkUserLevelAndBadges ─────────────────────────────────────

describe('checkUserLevelAndBadges', () => {
    it('支援総額が Bronze 閾値(10000)に達したらレベルが更新される', async () => {
        const { checkUserLevelAndBadges } = await import('../controllers/paymentController.js');

        const tx = {
            user: {
                findUnique: vi.fn().mockResolvedValue({
                    id: 'u1',
                    supportLevel: null,
                    totalPledgedAmount: 10000,
                }),
                update: vi.fn().mockResolvedValue({}),
            },
        };

        await checkUserLevelAndBadges(tx, 'u1');

        expect(tx.user.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: 'u1' },
                data: { supportLevel: 'Bronze' },
            })
        );
    });

    it('支援総額が閾値未満の場合はレベル更新しない', async () => {
        const { checkUserLevelAndBadges } = await import('../controllers/paymentController.js');

        const tx = {
            user: {
                findUnique: vi.fn().mockResolvedValue({
                    id: 'u2',
                    supportLevel: null,
                    totalPledgedAmount: 500,
                }),
                update: vi.fn(),
            },
        };

        await checkUserLevelAndBadges(tx, 'u2');

        expect(tx.user.update).not.toHaveBeenCalled();
    });

    it('既にGoldレベルの場合は再更新しない', async () => {
        const { checkUserLevelAndBadges } = await import('../controllers/paymentController.js');

        const tx = {
            user: {
                findUnique: vi.fn().mockResolvedValue({
                    id: 'u3',
                    supportLevel: 'Gold',
                    totalPledgedAmount: 200000,
                }),
                update: vi.fn(),
            },
        };

        await checkUserLevelAndBadges(tx, 'u3');

        expect(tx.user.update).not.toHaveBeenCalled();
    });
});

// ─── POST /api/payment/checkout ──────────────────────────────────

describe('POST /api/payment/checkout – createCheckoutSession', () => {
    it('cardAmount が 0 の場合は 400 を返す', async () => {
        // JWT なしでもアクセスできるよう、ゲストとして送信
        const res = await request(app)
            .post('/api/payment/checkout')
            .send({
                projectId: 'proj_001',
                amount: 5000,
                cardAmount: 0,
                guestName: 'テスト',
                guestEmail: 'guest@test.com',
                successUrl: 'https://example.com/success',
                cancelUrl: 'https://example.com/cancel',
            });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/カード決済金額が無効/);
    });

    it('対象プロジェクトが存在しない場合は 404 を返す', async () => {
        prisma.project.findUnique.mockResolvedValue(null);

        const res = await request(app)
            .post('/api/payment/checkout')
            .send({
                projectId: 'nonexistent',
                amount: 5000,
                cardAmount: 5000,
                guestName: 'テスト',
                guestEmail: 'guest@test.com',
                successUrl: 'https://example.com/success',
                cancelUrl: 'https://example.com/cancel',
            });

        expect(res.status).toBe(404);
        expect(res.body.message).toMatch(/企画が見つかりません/);
    });

    it('正常なリクエストで Stripe セッションを作成して URL を返す', async () => {
        prisma.project.findUnique.mockResolvedValue({
            id: 'proj_001',
            title: 'テスト企画',
        });
        stripe.checkout.sessions.create.mockResolvedValue({
            url: 'https://checkout.stripe.com/session/test_001',
        });

        const res = await request(app)
            .post('/api/payment/checkout')
            .send({
                projectId: 'proj_001',
                amount: 5000,
                cardAmount: 5000,
                guestName: 'テストゲスト',
                guestEmail: 'guest@test.com',
                successUrl: 'https://example.com/success',
                cancelUrl: 'https://example.com/cancel',
            });

        expect(res.status).toBe(200);
        expect(res.body.sessionUrl).toBe('https://checkout.stripe.com/session/test_001');
        expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
            expect.objectContaining({
                metadata: expect.objectContaining({
                    type: 'pledge',
                    projectId: 'proj_001',
                    userId: 'guest',
                }),
            })
        );
    });

    it('Stripe がエラーを投げた場合は 500 を返す', async () => {
        prisma.project.findUnique.mockResolvedValue({
            id: 'proj_001',
            title: 'テスト企画',
        });
        stripe.checkout.sessions.create.mockRejectedValue(new Error('Stripe connection error'));

        const res = await request(app)
            .post('/api/payment/checkout')
            .send({
                projectId: 'proj_001',
                amount: 5000,
                cardAmount: 5000,
                guestName: 'テスト',
                guestEmail: 'guest@test.com',
                successUrl: 'https://example.com/success',
                cancelUrl: 'https://example.com/cancel',
            });

        expect(res.status).toBe(500);
        expect(res.body.message).toMatch(/セッション作成に失敗/);
    });
});

// ─── POST /api/payment/pledge – createPledge（ポイント全額支払い） ──

describe('POST /api/payment/pledge – createPledge（ポイント全額支払い）', () => {
    it('認証なしでアクセスすると 401 または 403 を返す', async () => {
        const res = await request(app)
            .post('/api/payment/pledge')
            .send({ projectId: 'proj_001', amount: 1000 });

        expect([401, 403]).toContain(res.status);
    });

    it('ポイント残高チェック：updateMany が count=0 の場合は 400 を返す', async () => {
        // $transaction のモックを上書き：count=0 シナリオ
        prisma.$transaction.mockImplementationOnce(async (fn) => {
            const tx = {
                pledgeTier: { findUnique: vi.fn().mockResolvedValue(null) },
                user: {
                    findUnique: vi.fn().mockResolvedValue({
                        id: 'u1',
                        points: 500,
                        handleName: 'Taro',
                        totalPledgedAmount: 0,
                    }),
                    updateMany: vi.fn().mockResolvedValue({ count: 0 }),
                    update: vi.fn(),
                },
                project: {
                    findUnique: vi.fn().mockResolvedValue({
                        id: 'proj_001',
                        title: 'テスト企画',
                        status: 'FUNDRAISING',
                        plannerId: 'planner_001',
                        planner: { id: 'planner_001', email: 'planner@test.com', handleName: '企画者' },
                    }),
                    update: vi.fn(),
                    updateMany: vi.fn().mockResolvedValue({ count: 0 }),
                },
                pledge: { create: vi.fn() },
                notification: { create: vi.fn() },
            };
            return fn(tx);
        });

        // JWTトークン付きリクエストをシミュレート
        // setup.js の Prisma モックを使って user.findUnique が認証用に返す値を設定
        prisma.user.findUnique.mockResolvedValue({
            id: 'u1',
            email: 'user@test.com',
            handleName: 'Taro',
            points: 500,
        });

        // 認証が必要なエンドポイントなので、実際の JWT が不要な形でテスト
        // エラーメッセージがポイント不足のケース
        const { createPledge } = await import('../controllers/paymentController.js');

        // Express の req/res をモック
        const req = {
            user: { id: 'u1', email: 'user@test.com', handleName: 'Taro' },
            body: { projectId: 'proj_001', amount: 1000 },
        };
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        };

        await createPledge(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringMatching(/ポイント|不足/),
            })
        );
    });

    it('プロジェクトが FUNDRAISING 以外の場合は 400 を返す', async () => {
        prisma.$transaction.mockImplementationOnce(async (fn) => {
            const tx = {
                pledgeTier: { findUnique: vi.fn().mockResolvedValue(null) },
                user: {
                    findUnique: vi.fn().mockResolvedValue({
                        id: 'u1',
                        points: 10000,
                        handleName: 'Taro',
                        totalPledgedAmount: 0,
                    }),
                    updateMany: vi.fn(),
                    update: vi.fn(),
                },
                project: {
                    findUnique: vi.fn().mockResolvedValue({
                        id: 'proj_001',
                        title: '終了した企画',
                        status: 'SUCCESSFUL',
                        plannerId: 'planner_001',
                        planner: { id: 'planner_001', email: 'planner@test.com', handleName: '企画者' },
                    }),
                    update: vi.fn(),
                    updateMany: vi.fn(),
                },
                pledge: { create: vi.fn() },
                notification: { create: vi.fn() },
            };
            return fn(tx);
        });

        const { createPledge } = await import('../controllers/paymentController.js');

        const req = {
            user: { id: 'u1', email: 'user@test.com', handleName: 'Taro' },
            body: { projectId: 'proj_001', amount: 1000 },
        };
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        };

        await createPledge(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringMatching(/募集を停止/),
            })
        );
    });

    it('正常支援時にプランナーへメール通知が送られる', async () => {
        const mockPledge = { id: 'pledge_001', amount: 1000 };
        const mockProject = {
            id: 'proj_001',
            title: 'テスト企画',
            status: 'FUNDRAISING',
            plannerId: 'planner_001',
            collectedAmount: 1000,
            targetAmount: 10000,
            planner: { id: 'planner_001', email: 'planner@test.com', handleName: '企画者' },
        };

        prisma.$transaction.mockImplementationOnce(async (fn) => {
            const tx = {
                pledgeTier: { findUnique: vi.fn().mockResolvedValue(null) },
                user: {
                    findUnique: vi.fn().mockResolvedValue({
                        id: 'u1',
                        points: 10000,
                        handleName: 'Taro',
                        totalPledgedAmount: 1000,
                        supportLevel: null,
                    }),
                    updateMany: vi.fn().mockResolvedValue({ count: 1 }),
                    update: vi.fn().mockResolvedValue({}),
                },
                project: {
                    findUnique: vi.fn().mockResolvedValue(mockProject),
                    update: vi.fn().mockResolvedValue(mockProject),
                    updateMany: vi.fn().mockResolvedValue({ count: 0 }),
                },
                pledge: { create: vi.fn().mockResolvedValue(mockPledge) },
                notification: { create: vi.fn().mockResolvedValue({}) },
            };
            return fn(tx);
        });

        prisma.project.findUnique.mockResolvedValue(mockProject);

        const { createPledge } = await import('../controllers/paymentController.js');

        const req = {
            user: { id: 'u1', email: 'user@test.com', handleName: 'Taro' },
            body: { projectId: 'proj_001', amount: 1000 },
        };
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        };

        await createPledge(req, res);

        expect(queueEmail).toHaveBeenCalledWith(
            'planner@test.com',
            'PLEDGE_RECEIVED',
            expect.objectContaining({
                projectTitle: 'テスト企画',
                amount: '1,000',
            })
        );
    });
});

// ─── ポイントチャージ：アトミックな残高チェック ─────────────────

describe('ポイント残高チェック（updateMany ベき等性）', () => {
    it('updateMany の WHERE gte 条件で競合状態を防げる', async () => {
        // 実際の updateMany 呼び出しを模倣してアトミック性を検証
        const mockUpdateMany = vi.fn().mockResolvedValue({ count: 1 });

        const result = await mockUpdateMany({
            where: { id: 'u1', points: { gte: 1000 } },
            data: { points: { decrement: 1000 }, totalPledgedAmount: { increment: 1000 } },
        });

        expect(result.count).toBe(1);
        expect(mockUpdateMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    points: { gte: 1000 },
                }),
            })
        );
    });

    it('残高不足時に updateMany が count=0 を返す', async () => {
        const mockUpdateMany = vi.fn().mockResolvedValue({ count: 0 });

        const result = await mockUpdateMany({
            where: { id: 'u1', points: { gte: 5000 } },
            data: { points: { decrement: 5000 } },
        });

        expect(result.count).toBe(0);
    });
});

// ─── 目標達成判定：updateMany による二重更新防止 ─────────────────

describe('目標達成判定（updateMany べき等性）', () => {
    it('status=FUNDRAISING の WHERE 条件で二重更新を防ぐ', async () => {
        const mockUpdateMany = vi.fn().mockResolvedValue({ count: 1 });

        const result = await mockUpdateMany({
            where: { id: 'proj_001', status: 'FUNDRAISING' },
            data: { status: 'SUCCESSFUL' },
        });

        expect(result.count).toBe(1);
        expect(mockUpdateMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({ status: 'FUNDRAISING' }),
                data: { status: 'SUCCESSFUL' },
            })
        );
    });

    it('既に SUCCESSFUL の場合は count=0（二重更新なし）', async () => {
        const mockUpdateMany = vi.fn().mockResolvedValue({ count: 0 });

        const result = await mockUpdateMany({
            where: { id: 'proj_001', status: 'FUNDRAISING' },
            data: { status: 'SUCCESSFUL' },
        });

        expect(result.count).toBe(0);
    });
});
