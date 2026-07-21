import prisma from '../config/prisma.js';
import crypto from 'crypto';
import { logger } from '../utils/logger.js';

function generateCode() {
    return `FLST-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

export const issueGiftCard = async (req, res) => {
    try {
        const { points, message, expiresInDays = 365 } = req.body;
        const userId = req.user?.id;

        if (!points || points < 100 || points > 100000) {
            return res.status(400).json({ message: 'ポイント数は100〜100000の範囲で指定してください' });
        }

        const code = generateCode();
        const expiresAt = new Date(Date.now() + expiresInDays * 86400 * 1000);

        // 発行者の残高から原子的にポイントを差し引く（残高不足なら発行不可）。
        // これをしないと「自分で発行→自分で受取」で無限にポイントを生成できてしまう。
        const card = await prisma.$transaction(async (tx) => {
            const dec = await tx.user.updateMany({
                where: { id: userId, points: { gte: points } },
                data: { points: { decrement: points } },
            });
            if (dec.count === 0) {
                const err = new Error('ポイント残高が不足しています');
                err.statusCode = 400;
                throw err;
            }
            return tx.giftCard.create({
                data: { code, points, message, issuedById: userId, expiresAt },
            });
        });

        res.status(201).json(card);
    } catch (err) {
        if (err.statusCode === 400) {
            return res.status(400).json({ message: err.message });
        }
        logger.error('issueGiftCard error', { context: 'GiftCard', error: err.message });
        res.status(500).json({ message: 'ギフトカードの発行に失敗しました。' });
    }
};

export const redeemGiftCard = async (req, res) => {
    try {
        const { code } = req.body;
        const userId = req.user.id;

        if (!code || typeof code !== 'string' || code.trim().length === 0) {
            return res.status(400).json({ message: 'ギフトカードコードを入力してください。' });
        }

        const card = await prisma.giftCard.findUnique({ where: { code: code.trim().toUpperCase() } });

        if (!card) return res.status(404).json({ message: '無効なギフトカードコードです' });
        if (card.redeemedById) return res.status(409).json({ message: 'このコードはすでに使用されています' });
        if (card.expiresAt < new Date()) return res.status(410).json({ message: 'このギフトカードの有効期限が切れています' });

        // 同時リクエストでの二重付与を防ぐため、未使用(redeemedById=null)を条件に原子的に確保する。
        // updateMany の count で「自分が確保できたか」を判定し、確保できた時のみポイントを付与する。
        const points = card.points;
        const result = await prisma.$transaction(async (tx) => {
            const claimed = await tx.giftCard.updateMany({
                where: { id: card.id, redeemedById: null },
                data: { redeemedById: userId, redeemedAt: new Date() },
            });
            if (claimed.count === 0) {
                return { ok: false };
            }
            await tx.user.update({
                where: { id: userId },
                data: { points: { increment: points } },
            });
            return { ok: true };
        });

        if (!result.ok) {
            return res.status(409).json({ message: 'このコードはすでに使用されています' });
        }

        res.json({ success: true, points });
    } catch (err) {
        logger.error('redeemGiftCard error', { context: 'GiftCard', error: err.message });
        res.status(500).json({ message: 'ギフトカードの使用に失敗しました。' });
    }
};

export const getMyGiftCards = async (req, res) => {
    try {
        const userId = req.user.id;
        const cards = await prisma.giftCard.findMany({
            where: { issuedById: userId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        res.json(cards);
    } catch (err) {
        logger.error('getMyGiftCards error', { context: 'GiftCard', error: err.message });
        res.status(500).json({ message: 'ギフトカード一覧の取得に失敗しました。' });
    }
};

export const getGiftCardInfo = async (req, res) => {
    try {
        const { code } = req.params;
        const card = await prisma.giftCard.findUnique({
            where: { code: code.trim().toUpperCase() },
            select: { points: true, message: true, expiresAt: true, redeemedById: true },
        });
        if (!card) return res.status(404).json({ message: '無効なコードです' });
        res.json({
            points: card.points,
            message: card.message,
            expiresAt: card.expiresAt,
            isRedeemed: !!card.redeemedById,
        });
    } catch (err) {
        logger.error('getGiftCardInfo error', { context: 'GiftCard', error: err.message });
        res.status(500).json({ message: 'ギフトカード情報の取得に失敗しました。' });
    }
};
