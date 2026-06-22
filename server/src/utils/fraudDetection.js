import prisma from '../config/prisma.js';

const RULES = [
    // 同一ユーザーが1企画に3回以上支援
    async (userId, projectId) => {
        const count = await prisma.pledge.count({ where: { userId, projectId } });
        if (count >= 3) return { reason: 'REPEATED_PLEDGE', detail: `同一企画への支援 ${count} 回` };
        return null;
    },
    // 過去1時間に5件以上の支援
    async (userId) => {
        const since = new Date(Date.now() - 60 * 60 * 1000);
        const count = await prisma.pledge.count({ where: { userId, createdAt: { gte: since } } });
        if (count >= 5) return { reason: 'HIGH_VELOCITY', detail: `1時間に ${count} 件の支援` };
        return null;
    },
    // 1回の支援が10万pt超
    async (userId, projectId, amount) => {
        if (amount >= 100000) return { reason: 'LARGE_AMOUNT', detail: `${amount.toLocaleString()} pt の大口支援` };
        return null;
    },
];

export async function detectFraud(userId, projectId, amount) {
    const results = await Promise.all(RULES.map(r => r(userId, projectId, amount)));
    const flags = results.filter(Boolean);
    if (flags.length === 0) return null;

    // FraudFlag レコードを作成（テーブルがなければスキップ）
    try {
        await prisma.fraudFlag.create({
            data: {
                userId,
                projectId,
                reasons: flags.map(f => f.reason),
                details: flags.map(f => f.detail).join(' / '),
            },
        });
    } catch (_) {
        // テーブル未作成の場合は無視（schema.prisma に後で追加）
    }

    return flags;
}
