import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// app をインポート（setup.js でモック済み）
const { default: app } = await import('../app.js');
const { default: prisma } = await import('../config/prisma.js');
const { sendDynamicEmail, queueEmail } = await import('../utils/email.js');

beforeEach(() => {
    vi.clearAllMocks();
});

// ─── registerUser ───────────────────────────────────────────────

describe('POST /api/auth/register', () => {
    it('新規ユーザーを正常登録できる', async () => {
        prisma.user.findUnique.mockResolvedValue(null);
        prisma.user.create.mockResolvedValue({ id: 'u1', email: 'test@example.com' });
        sendDynamicEmail.mockResolvedValue(undefined);

        const res = await request(app)
            .post('/api/auth/register')
            .send({ email: 'test@example.com', password: 'Pass1234!', handleName: 'Taro' });

        expect(res.status).toBe(201);
        expect(res.body.message).toMatch(/確認メール/);
        expect(sendDynamicEmail).toHaveBeenCalledWith(
            'test@example.com',
            'VERIFICATION_EMAIL',
            expect.objectContaining({ userName: 'Taro' })
        );
    });

    it('既存メールアドレスで409を返す', async () => {
        prisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'dup@example.com' });

        const res = await request(app)
            .post('/api/auth/register')
            .send({ email: 'dup@example.com', password: 'Pass1234!', handleName: 'Dup' });

        expect(res.status).toBe(409);
        expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('紹介コードが有効ならリファラルボーナスポイントを付与する', async () => {
        const referrer = { id: 'r1', email: 'ref@example.com', handleName: 'Ref', referralCode: 'REF001' };
        prisma.user.findUnique
            .mockResolvedValueOnce(null)       // メール重複チェック
            .mockResolvedValueOnce(referrer);  // 紹介コード検索
        prisma.user.create.mockResolvedValue({ id: 'u2' });
        prisma.user.update.mockResolvedValue({});
        sendDynamicEmail.mockResolvedValue(undefined);

        const res = await request(app)
            .post('/api/auth/register')
            .send({ email: 'new@example.com', password: 'Pass1234!', handleName: 'New', referralCode: 'REF001' });

        expect(res.status).toBe(201);
        expect(prisma.user.update).toHaveBeenCalledWith(
            expect.objectContaining({ where: { id: 'r1' }, data: { points: { increment: expect.any(Number) } } })
        );
        expect(queueEmail).toHaveBeenCalledWith('ref@example.com', 'REFERRAL_BONUS', expect.any(Object));
    });
});

// ─── loginUser ──────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
    it('未登録メールアドレスで404を返す', async () => {
        prisma.user.findUnique.mockResolvedValue(null);

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'nobody@example.com', password: 'any' });

        expect(res.status).toBe(404);
    });

    it('メール未確認ユーザーで403を返す', async () => {
        prisma.user.findUnique.mockResolvedValue({
            id: 'u1', email: 'unverified@example.com',
            password: '$2b$10$invalidhash', isVerified: false,
        });

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'unverified@example.com', password: 'anypass' });

        expect(res.status).toBe(403);
    });
});
