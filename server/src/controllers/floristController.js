import prisma from '../config/prisma.js';
import OpenAI from 'openai';
import { createNotification } from '../utils/notification.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });



// ==========================================
// ★★★ 1. お花屋さん検索・取得 ★★★
// ==========================================

export const getFlorists = async (req, res) => {
    try {
        const { keyword, prefecture, rush, tag } = req.query;
        const whereClause = { status: 'APPROVED' };

        if (keyword && keyword.trim() !== '') {
            whereClause.OR = [
                { platformName: { contains: keyword, mode: 'insensitive' } },
                { portfolio: { contains: keyword, mode: 'insensitive' } },
            ];
        }
        if (prefecture && prefecture.trim() !== '') {
            whereClause.address = { contains: prefecture };
        }
        if (tag && tag.trim() !== '') {
            whereClause.specialties = { has: tag.trim() };
        }
        if (rush === 'true') {
            whereClause.acceptsRushOrders = true;
        }

        const florists = await prisma.florist.findMany({
            where: whereClause,
            select: {
                id: true, platformName: true, portfolio: true, address: true,
                iconUrl: true, portfolioImages: true, specialties: true, acceptsRushOrders: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        // レビュー件数付与
        const floristsWithRating = await Promise.all(florists.map(async (florist) => {
            const reviewCount = await prisma.review.count({ where: { floristId: florist.id } });
            return { ...florist, reviewCount, averageRating: 0 };
        }));

        res.status(200).json(floristsWithRating);
    } catch (error) {
        res.status(500).json({ message: 'お花屋さんの取得中にエラーが発生しました。' });
    }
};

export const getFloristById = async (req, res) => {
    const { id } = req.params;
    try {
        const florist = await prisma.florist.findUnique({ where: { id } });
        if (!florist) return res.status(404).json({ message: '花屋が見つかりません。' });

        const appealPosts = await prisma.floristPost.findMany({
            where: { floristId: id, isPublic: true },
            include: { likes: { select: { userId: true } }, _count: { select: { likes: true } } },
            orderBy: { createdAt: 'desc' }
        });

        const { password, laruBotApiKey, ...publicData } = florist;
        publicData.appealPosts = appealPosts;
        res.status(200).json(publicData);
    } catch (error) {
        res.status(500).json({ message: 'サーバーエラーが発生しました。' });
    }
};

// AIマッチング (タグ抽出)
export const matchFloristsByAi = async (req, res) => {
    const { designDetails, flowerTypes } = req.body;
    const STYLE_TAGS = ['かわいい/キュート', 'クール/かっこいい', 'おしゃれ/モダン', '和風/和モダン', 'ゴージャス/豪華', 'パステルカラー', 'ビビッドカラー', 'バルーン装飾', 'ペーパーフラワー', '大型/連結', '卓上/楽屋花'];

    if (!designDetails && !flowerTypes) return res.json({ recommendedFlorists: [] });

    try {
        let targetTags = [];
        if (process.env.OPENAI_API_KEY) {
            const prompt = `要望: "${designDetails} ${flowerTypes}"\n選択肢: ${STYLE_TAGS.join(', ')}\n出力形式: タグ1, タグ2, タグ3`;
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }],
            });
            targetTags = completion.choices[0].message.content.split(',').map(t => t.trim());
        } else {
            targetTags = STYLE_TAGS.filter(tag => (designDetails + flowerTypes).includes(tag.split('/')[0]));
        }

        const florists = await prisma.florist.findMany({
            where: { status: 'APPROVED', specialties: { hasSome: targetTags } },
            select: { id: true, platformName: true, iconUrl: true, portfolioImages: true, specialties: true },
            take: 4
        });
        res.json({ tags: targetTags, recommendedFlorists: florists });
    } catch (error) {
        res.status(500).json({ message: 'マッチング処理に失敗しました' });
    }
};

// ==========================================
// ★★★ 2. オファー & 見積もり (Business) ★★★
// ==========================================

// オファー作成 (Planner -> Florist)
export const createOffer = async (req, res) => {
    const { projectId, floristId } = req.body;
    const plannerId = req.user.id;

    try {
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project || project.plannerId !== plannerId) return res.status(403).json({ message: '権限がありません。' });

        const newOffer = await prisma.offer.create({
            data: { projectId, floristId }
        });
        await createNotification(floristId, 'NEW_OFFER', `新しいオファーが届きました！`, projectId, `/florists/offers/${newOffer.id}`);
        
        res.status(201).json(newOffer);
    } catch (error) {
        if (error.code === 'P2002') return res.status(409).json({ message: '既にオファー済みです。' });
        res.status(500).json({ message: 'オファー作成エラー' });
    }
};

// オファー回答 (Florist -> Planner)
export const respondToOffer = async (req, res) => {
    const { offerId } = req.params;
    const { status } = req.body;
    const floristId = req.user.id;

    if (req.user.role !== 'FLORIST') return res.status(403).json({ message: '権限がありません。' });

    try {
        const offer = await prisma.offer.findUnique({ where: { id: offerId } });
        if (!offer || offer.floristId !== floristId) return res.status(403).json({ message: '権限がありません。' });

        const updatedOffer = await prisma.offer.update({
            where: { id: offerId },
            data: { status },
            include: { project: true, chatRoom: true }
        });

        if (status === 'ACCEPTED') {
            if (!updatedOffer.chatRoom) {
                await prisma.chatRoom.create({ data: { offerId: offerId } });
            }
            await createNotification(updatedOffer.project.plannerId, 'OFFER_ACCEPTED', 'オファーが承諾されました！', updatedOffer.projectId, `/projects/${updatedOffer.projectId}/chat`);
        } else if (status === 'REJECTED') {
            await createNotification(updatedOffer.project.plannerId, 'OFFER_REJECTED', 'オファーが辞退されました。', updatedOffer.projectId, `/florists`);
        }

        res.status(200).json(updatedOffer);
    } catch (error) {
        res.status(500).json({ message: '更新エラー' });
    }
};

// 見積書作成 (Florist)
export const createQuotation = async (req, res) => {
    const { projectId, items } = req.body;
    const floristId = req.user.id;

    if (req.user.role !== 'FLORIST') return res.status(403).json({ message: '権限がありません。' });

    try {
        const offer = await prisma.offer.findFirst({ where: { projectId, floristId, status: 'ACCEPTED' } });
        if (!offer) return res.status(403).json({ message: '権限がありません。' });

        const totalAmount = items.reduce((sum, item) => sum + parseInt(item.amount, 10), 0);

        const newQuotation = await prisma.quotation.create({
            data: {
                projectId,
                totalAmount,
                items: { create: items.map(item => ({ itemName: item.itemName, amount: parseInt(item.amount, 10) })) },
            },
            include: { items: true },
        });

        const project = await prisma.project.findUnique({ where: { id: projectId } });
        await createNotification(project.plannerId, 'QUOTATION_RECEIVED', '見積もりが届きました。', projectId, `/projects/${projectId}/quotation`);

        res.status(201).json(newQuotation);
    } catch (error) {
        res.status(500).json({ message: '作成エラー' });
    }
};

// 見積書承認 (Planner)
export const approveQuotation = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const result = await prisma.$transaction(async (tx) => {
            const quotation = await tx.quotation.findUnique({ where: { id }, include: { project: true } });
            if (!quotation || quotation.project.plannerId !== userId) throw new Error('権限がありません。');
            if (quotation.isApproved) throw new Error('既に承認済みです。');

            const project = quotation.project;
            if (project.collectedAmount < quotation.totalAmount) throw new Error('ポイント不足です。');

            const offer = await tx.offer.findUnique({ where: { projectId: project.id }, include: { florist: true } });
            
            // 手数料計算
            const systemSettings = await tx.systemSettings.findFirst() || { platformFeeRate: 0.10 };
            const feeRate = offer.florist.customFeeRate ?? systemSettings.platformFeeRate ?? 0.10;
            const commission = Math.floor(quotation.totalAmount * feeRate);
            const netPayout = quotation.totalAmount - commission;

            // 売上反映
            await tx.florist.update({
                where: { id: offer.floristId },
                data: { balance: { increment: netPayout } },
            });
            await tx.commission.create({ data: { amount: commission, projectId: project.id } });
            
            const approved = await tx.quotation.update({
                where: { id },
                data: { isApproved: true }
            });

            await createNotification(offer.floristId, 'QUOTATION_APPROVED', `見積もりが承認されました。利益: ${netPayout}pt`, project.id, `/florists/offers/${offer.id}`);
            
            return approved;
        });
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// 見積書最終確定 (Florist)
export const finalizeQuotation = async (req, res) => {
    const { id } = req.params;
    const floristId = req.user.id;

    try {
        const quotation = await prisma.quotation.findUnique({ where: { id }, include: { project: { include: { offer: true } } } });
        if (!quotation || quotation.project.offer?.floristId !== floristId) return res.status(403).json({ message: '権限がありません。' });

        const finalized = await prisma.quotation.update({
            where: { id },
            data: { isFinalized: true, finalizedAt: new Date() }
        });
        res.status(200).json(finalized);
    } catch (error) {
        res.status(500).json({ message: '確定エラー' });
    }
};

// ==========================================
// ★★★ 3. お花屋さん管理 (Profile & Payouts) ★★★
// ==========================================

// プロフィール更新
export const updateFloristProfile = async (req, res) => {
    const floristId = req.user.id;
    if (req.user.role !== 'FLORIST') return res.status(403).json({ message: '権限がありません。' });

    const { shopName, platformName, contactName, address, phoneNumber, website, portfolio, laruBotApiKey, portfolioImages, businessHours, iconUrl, specialties, acceptsRushOrders } = req.body;

    try {
        let dataToUpdate = { shopName, platformName, contactName, address, phoneNumber, website, portfolio, laruBotApiKey, businessHours, iconUrl, specialties, acceptsRushOrders };
        if (portfolioImages && Array.isArray(portfolioImages)) {
            dataToUpdate.portfolioImages = portfolioImages.map(item => JSON.stringify(item));
        }

        const updated = await prisma.florist.update({ where: { id: floristId }, data: dataToUpdate });
        const { password, ...clean } = updated;
        res.status(200).json(clean);
    } catch (error) {
        res.status(500).json({ message: '更新エラー' });
    }
};

// 出金申請履歴
export const getPayouts = async (req, res) => {
    const floristId = req.user.id;
    if (req.user.role !== 'FLORIST') return res.status(403).json({ message: '権限がありません。' });
    try {
        const payouts = await prisma.payoutRequest.findMany({ where: { floristId }, orderBy: { createdAt: 'desc' } });
        res.status(200).json(payouts);
    } catch (error) {
        res.status(500).json({ message: '取得エラー' });
    }
};

// 出金申請 (Florist Only - Sales Balance)
export const requestPayout = async (req, res) => {
    const floristId = req.user.id;
    const { amount, accountInfo } = req.body;
    if (req.user.role !== 'FLORIST') return res.status(403).json({ message: '権限がありません。' });

    const payoutAmount = parseInt(amount, 10);
    if (payoutAmount < 1000) return res.status(400).json({ message: '1000ptから申請可能です。' });

    try {
        const result = await prisma.$transaction(async (tx) => {
            const florist = await tx.florist.findUnique({ where: { id: floristId } });
            if (florist.balance < payoutAmount) throw new Error('残高不足です。');

            await tx.florist.update({ where: { id: floristId }, data: { balance: { decrement: payoutAmount } } });
            return await tx.payoutRequest.create({
                data: { amount: payoutAmount, accountInfo, floristId }
            });
        });
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// スケジュール取得
export const getSchedule = async (req, res) => {
    const floristId = req.user.id;
    try {
        const offers = await prisma.offer.findMany({
            where: { floristId, status: 'ACCEPTED' },
            include: { project: { select: { id: true, title: true, deliveryDateTime: true, deliveryAddress: true, venue: { select: { venueName: true } }, productionStatus: true } } },
            orderBy: { project: { deliveryDateTime: 'asc' } }
        });
        const events = offers.map(o => ({
            id: o.project.id,
            title: o.project.title,
            date: o.project.deliveryDateTime,
            location: o.project.venue?.venueName || o.project.deliveryAddress,
            status: o.project.productionStatus
        }));
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: '取得エラー' });
    }
};

// ==========================================
// ★★★ 4. 投稿・特売・その他 ★★★
// ==========================================

// アピール投稿作成
export const createFloristPost = async (req, res) => {
    const floristId = req.user.id;
    const { imageUrl, content, isPublic } = req.body;
    if (req.user.role !== 'FLORIST') return res.status(403).json({ message: '権限がありません。' });

    try {
        const post = await prisma.floristPost.create({
            data: { floristId, imageUrl, content, isPublic: isPublic ?? true },
            include: { florist: { select: { platformName: true, iconUrl: true } }, likes: true, _count: { select: { likes: true } } }
        });
        res.status(201).json(post);
    } catch (error) {
        res.status(500).json({ message: '投稿エラー' });
    }
};

// アピール投稿へのいいね
export const likeFloristPost = async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;
    // 花屋等はいいね不可
    if (['FLORIST', 'VENUE', 'ADMIN'].includes(req.user.role)) return res.status(403).json({ message: 'いいねできません。' });

    try {
        const existing = await prisma.floristPostLike.findUnique({ where: { floristPostId_userId: { floristPostId: postId, userId } } });
        if (existing) {
            await prisma.floristPostLike.delete({ where: { id: existing.id } });
            res.json({ liked: false });
        } else {
            await prisma.floristPostLike.create({ data: { floristPostId: postId, userId } });
            res.json({ liked: true });
        }
    } catch (error) {
        res.status(500).json({ message: 'エラーが発生しました' });
    }
};

// ロスゼロ特売情報 (簡易メモリ実装例 -> 本番はDBへ)
let SPECIAL_DEALS = [];
export const createDeal = (req, res) => {
    if (req.user.role !== 'FLORIST') return res.status(403).json({ message: '権限なし' });
    const { color, flower, discount, message } = req.body;
    const deal = { id: Date.now().toString(), floristId: req.user.id, floristName: req.user.shopName, color, flower, discount, message };
    SPECIAL_DEALS.push(deal);
    res.status(201).json(deal);
};
export const getMyDeals = (req, res) => {
    res.json(SPECIAL_DEALS.filter(d => d.floristId === req.user.id));
};
export const searchDeals = (req, res) => {
    const { keyword } = req.query;
    if (!keyword) return res.json([]);
    const matches = SPECIAL_DEALS.filter(d => d.color.includes(keyword) || d.flower.includes(keyword) || d.message.includes(keyword));
    res.json(matches);
};