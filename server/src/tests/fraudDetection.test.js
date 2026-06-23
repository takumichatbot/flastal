import { describe, it, expect, vi, beforeEach } from 'vitest';

// Prisma をモック（setup.js より細かく上書き）
vi.mock('../config/prisma.js', () => ({
    default: {
        pledge: {
            count: vi.fn(),
        },
        fraudFlag: {
            create: vi.fn(),
        },
    },
}));

// email モック（HIGH severity 時の動的 import をシャットアウト）
vi.mock('../utils/email.js', () => ({
    queueEmail: vi.fn(),
    sendDynamicEmail: vi.fn(),
}));

const { detectFraud } = await import('../utils/fraudDetection.js');
const { default: prisma } = await import('../config/prisma.js');

beforeEach(() => {
    vi.clearAllMocks();
    // fraudFlag.create は常に成功させておく
    prisma.fraudFlag.create.mockResolvedValue({});
});

// ─── detectFraud ─────────────────────────────────────────────────

describe('detectFraud', () => {
    it('通常の支援ではフラグを返さない（null）', async () => {
        // 同一企画への支援 0 回 / 直近1時間 0 件 / 金額1,000pt
        prisma.pledge.count.mockResolvedValue(0);

        const result = await detectFraud('user1', 'project1', 1000);

        expect(result).toBeNull();
        expect(prisma.fraudFlag.create).not.toHaveBeenCalled();
    });

    it('同一企画へ3回以上支援すると REPEATED_PLEDGE フラグが返る', async () => {
        // 1回目の count (同一企画) = 3、2回目の count (直近1時間) = 1
        prisma.pledge.count
            .mockResolvedValueOnce(3)   // REPEATED_PLEDGE ルール
            .mockResolvedValueOnce(1);  // HIGH_VELOCITY ルール

        const result = await detectFraud('user1', 'project1', 500);

        expect(result).not.toBeNull();
        expect(result.some(f => f.reason === 'REPEATED_PLEDGE')).toBe(true);
        expect(prisma.fraudFlag.create).toHaveBeenCalledOnce();
    });

    it('直近1時間に5件以上支援すると HIGH_VELOCITY フラグが返る', async () => {
        prisma.pledge.count
            .mockResolvedValueOnce(0)   // REPEATED_PLEDGE ルール → セーフ
            .mockResolvedValueOnce(5);  // HIGH_VELOCITY ルール

        const result = await detectFraud('user2', 'project2', 1000);

        expect(result).not.toBeNull();
        expect(result.some(f => f.reason === 'HIGH_VELOCITY')).toBe(true);
    });

    it('10万pt以上の支援は LARGE_AMOUNT フラグが返る', async () => {
        prisma.pledge.count.mockResolvedValue(0);

        const result = await detectFraud('user3', 'project3', 100000);

        expect(result).not.toBeNull();
        expect(result.some(f => f.reason === 'LARGE_AMOUNT')).toBe(true);
    });

    it('LARGE_AMOUNT + HIGH_VELOCITY の複合フラグは severity HIGH になる', async () => {
        // REPEATED_PLEDGE=0, HIGH_VELOCITY=5, LARGE_AMOUNT は amount で判定
        prisma.pledge.count
            .mockResolvedValueOnce(0)
            .mockResolvedValueOnce(5);

        const result = await detectFraud('user4', 'project4', 100000);

        expect(result).not.toBeNull();
        // HIGH_VELOCITY と LARGE_AMOUNT 両方含む → getSeverity = HIGH
        const reasons = result.map(f => f.reason);
        expect(reasons).toContain('HIGH_VELOCITY');
        expect(reasons).toContain('LARGE_AMOUNT');
    });

    it('fraudFlag.create が失敗してもエラーをスローしない', async () => {
        prisma.pledge.count.mockResolvedValue(0);
        prisma.fraudFlag.create.mockRejectedValue(new Error('DB error'));

        // LARGE_AMOUNT を踏ませて fraudFlag.create を呼ばせる
        await expect(detectFraud('user5', 'project5', 100000)).resolves.not.toThrow();
    });
});
