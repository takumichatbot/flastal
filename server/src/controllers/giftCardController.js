import prisma from '../config/prisma.js';
import crypto from 'crypto';

function generateCode() {
    return `FLST-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

export const issueGiftCard = async (req, res) => {
    const { points, message, expiresInDays = 365 } = req.body;
    const userId = req.user?.id;

    if (!points || points < 100 || points > 100000) {
        return res.status(400).json({ message: 'ポイント数は100〜100000の範囲で指定してください' });
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + expiresInDays * 86400 * 1000);

    const card = await prisma.giftCard.create({
        data: { code, points, message, issuedById: userId, expiresAt },
    });

    res.status(201).json(card);
};

export const redeemGiftCard = async (req, res) => {
    const { code } = req.body;
    const userId = req.user.id;

    if (!code) return res.status(400).json({ message: 'コードを入力してください' });

    const card = await prisma.giftCard.findUnique({ where: { code: code.trim().toUpperCase() } });

    if (!card) return res.status(404).json({ message: '無効なギフトカードコードです' });
    if (card.redeemedById) return res.status(409).json({ message: 'このコードはすでに使用されています' });
    if (card.expiresAt < new Date()) return res.status(410).json({ message: 'このギフトカードの有効期限が切れています' });

    const [updatedCard] = await prisma.$transaction([
        prisma.giftCard.update({
            where: { id: card.id },
            data: { redeemedById: userId, redeemedAt: new Date() },
        }),
        prisma.user.update({
            where: { id: userId },
            data: { points: { increment: card.points } },
        }),
    ]);

    res.json({ success: true, points: card.points, card: updatedCard });
};

export const getMyGiftCards = async (req, res) => {
    const userId = req.user.id;
    const cards = await prisma.giftCard.findMany({
        where: { issuedById: userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
    });
    res.json(cards);
};

export const getGiftCardInfo = async (req, res) => {
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
};
