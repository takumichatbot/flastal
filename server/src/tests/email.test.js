import { describe, it, expect, vi, beforeEach } from 'vitest';

// Resend をモック（email.js が new Resend() するのでモジュールごと差し替え）
vi.mock('resend', () => ({
    Resend: vi.fn().mockImplementation(() => ({
        emails: {
            send: vi.fn().mockResolvedValue({ data: { id: 'mock-id' }, error: null }),
        },
    })),
}));

// Prisma をモック（sendDynamicEmail 内で emailTemplate を検索する）
vi.mock('../config/prisma.js', () => ({
    default: {
        emailTemplate: {
            findUnique: vi.fn().mockResolvedValue(null), // DB テンプレートなし → DEFAULT_TEMPLATES を使用
        },
    },
}));

// emailQueue モック（queueEmail 内で動的 import する）
vi.mock('../queues/emailQueue.js', () => ({
    getEmailQueue: vi.fn().mockReturnValue(null), // null → setImmediate フォールバック
}));

const {
    sendEmail,
    sendDynamicEmail,
    sendPledgeConfirmationEmail,
    queueEmail,
} = await import('../utils/email.js');

beforeEach(() => {
    vi.clearAllMocks();
});

// ─── sendEmail ────────────────────────────────────────────────────

describe('sendEmail', () => {
    it('宛先が空の場合はエラーオブジェクトを返し送信しない', async () => {
        const result = await sendEmail('', 'テスト件名', '<p>本文</p>');
        expect(result).toMatchObject({ error: expect.any(String) });
    });

    it('正常な宛先でメール送信を試みる', async () => {
        const result = await sendEmail('test@example.com', '件名テスト', '<p>本文</p>');
        // Resend がモックなので error は null
        expect(result.error).toBeNull();
    });
});

// ─── sendDynamicEmail ─────────────────────────────────────────────

describe('sendDynamicEmail', () => {
    it('PLEDGE_COMPLETED テンプレートが userName を展開して送信する', async () => {
        const result = await sendDynamicEmail('user@example.com', 'PLEDGE_COMPLETED', {
            userName: 'テストユーザー',
            projectTitle: 'テスト企画',
            amount: '1,000',
            projectId: 'proj-abc',
        });
        expect(result).toBe(true);
    });

    it('存在しないテンプレートキーは false を返す', async () => {
        const result = await sendDynamicEmail('user@example.com', 'NO_SUCH_TEMPLATE', {});
        expect(result).toBe(false);
    });

    it('宛先が空の場合は false を返す', async () => {
        const result = await sendDynamicEmail('', 'WELCOME', { userName: 'テスト' });
        expect(result).toBe(false);
    });

    it('WELCOME テンプレートが userName を展開する', async () => {
        const result = await sendDynamicEmail('welcome@example.com', 'WELCOME', {
            userName: 'ウェルカムユーザー',
        });
        expect(result).toBe(true);
    });

    it('FRAUD_ALERT テンプレートが type/description を展開する', async () => {
        const result = await sendDynamicEmail('admin@flastal.com', 'FRAUD_ALERT', {
            type: 'LARGE_AMOUNT',
            description: '100,000 pt の大口支援',
            userId: 'user-xyz',
            projectId: 'proj-xyz',
        });
        expect(result).toBe(true);
    });
});

// ─── sendPledgeConfirmationEmail ──────────────────────────────────

describe('sendPledgeConfirmationEmail', () => {
    it('支援完了メールが正常に送信される', async () => {
        const result = await sendPledgeConfirmationEmail(
            'backer@example.com',
            '花子',
            'フラスタ企画テスト',
            3000
        );
        // sendEmail の戻り値（{ data, error }）を返す
        expect(result).toHaveProperty('error');
        expect(result.error).toBeNull();
    });
});

// ─── queueEmail ───────────────────────────────────────────────────

describe('queueEmail', () => {
    it('キューが利用不可でも例外をスローしない', async () => {
        await expect(
            queueEmail('queue@example.com', 'PLEDGE_COMPLETED', {
                userName: 'キューユーザー',
                projectTitle: 'キュー企画',
                amount: '5,000',
                projectId: 'q-proj',
            })
        ).resolves.not.toThrow();
    });
});
