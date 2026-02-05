import prisma from '../config/prisma.js';
import OpenAI from 'openai';
import { createNotification } from '../utils/notification.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ==========================================
// ★★★ 1. お花屋さん検索・取得 ★★★
// ==========================================

/**
 * ログイン中のお花屋さん自身の情報を取得
 * 【超重要】DB再検索に失敗するため、認証済みのユーザー情報をそのまま返却する方式へ変更
 */
export const getFloristProfile = async (req, res) => {
    try {
        const floristId = req.user.id; // トークンからID取得

        // 1. 花屋の基本情報とオファーを取得
        const florist = await prisma.florist.findUnique({
            where: { id: floristId },
            include: {
                // オファー情報（プロジェクト内容も含む）
                offers: {
                    include: {
                        project: {
                            select: {
                                id: true,
                                title: true,
                                targetAmount: true,
                                deliveryDateTime: true,
                                productionStatus: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!florist) {
            return res.status(404).json({ message: 'お花屋さん情報が見つかりません。' });
        }

        // 2. 制作アピール投稿を取得（公開・非公開問わず全て）
        const appealPosts = await prisma.floristPost.findMany({
            where: { floristId: floristId },
            include: {
                likes: true, 
                _count: { select: { likes: true } } 
            },
            orderBy: { createdAt: 'desc' }
        });

        // 3. データを結合して返却
        const { password, laruBotApiKey, ...safeData } = florist;
        
        // ダッシュボードが期待している形に整形
        const responseData = {
            ...safeData,
            appealPosts: appealPosts, // ここに投稿リストが入ります
            offers: florist.offers || []
        };

        res.status(200).json(responseData);

    } catch (error) {
        console.error('getFloristProfile Error:', error);
        res.status(500).json({ message: 'サーバーエラーが発生しました。' });
    }
};

// ★追加1: 投稿の更新 (公開/非公開の切り替え)
export const updateFloristPost = async (req, res) => {
    const { id } = req.params;
    const floristId = req.user.id;
    const { isPublic, content } = req.body;

    if (req.user.role !== 'FLORIST') return res.status(403).json({ message: '権限がありません。' });

    try {
        const post = await prisma.floristPost.findUnique({ where: { id } });
        if (!post || post.floristId !== floristId) {
            return res.status(403).json({ message: '編集権限がありません。' });
        }

        const dataToUpdate = {};
        if (isPublic !== undefined) dataToUpdate.isPublic = isPublic;
        if (content !== undefined) dataToUpdate.content = content;

        const updated = await prisma.floristPost.update({
            where: { id },
            data: dataToUpdate
        });
        res.json(updated);
    } catch (error) {
        console.error('updateFloristPost Error:', error);
        res.status(500).json({ message: '更新に失敗しました。' });
    }
};

// ★追加2: 投稿の削除
export const deleteFloristPost = async (req, res) => {
    const { id } = req.params;
    const floristId = req.user.id;

    if (req.user.role !== 'FLORIST') return res.status(403).json({ message: '権限がありません。' });

    try {
        const post = await prisma.floristPost.findUnique({ where: { id } });
        if (!post || post.floristId !== floristId) {
            return res.status(403).json({ message: '削除権限がありません。' });
        }

        await prisma.floristPost.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        console.error('deleteFloristPost Error:', error);
        res.status(500).json({ message: '削除に失敗しました。' });
    }
};

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
                _count: { select: { reviews: true } }
            },
            orderBy: { createdAt: 'desc' },
        });

        const floristsWithRating = florists.map(florist => ({
            ...florist,
            reviewCount: florist._count.reviews,
            averageRating: 0,
            _count: undefined
        }));

        res.status(200).json(floristsWithRating);
    } catch (error) {
        console.error('getFlorists Error:', error);
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
        console.error('getFloristById Error:', error);
        res.status(500).json({ message: 'サーバーエラーが発生しました。' });
    }
};

export const matchFloristsByAi = async (req, res) => {
    const { designDetails, flowerTypes } = req.body;
    const STYLE_TAGS = ['かわいい/キュート', 'クール/かっこいい', 'おしゃれ/モダン', '和風/和モダン', 'ゴージャス/豪華', 'パステルカラー', 'ビビッドカラー', 'バルーン装飾', 'ペーパーフラワー', '大型/連結', '卓上/楽屋花'];

    if (!designDetails && !flowerTypes) return res.json({ recommendedFlorists: [] });

    try {
        let targetTags = [];
        if (process.env.OPENAI_API_KEY) {
            const prompt = `以下の要望に合うタグを、選択肢の中から最大3つ抽出してカンマ区切りで出力してください。\n要望: "${designDetails} ${flowerTypes}"\n選択肢: ${STYLE_TAGS.join(', ')}`;
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
        console.error('AI Match Error:', error);
        res.status(500).json({ message: 'マッチング処理に失敗しました' });
    }
};

// ==========================================
// ★★★ 2. オファー & 見積もり (Business) ★★★
// ==========================================

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
        res.status(500).json({ message: 'オファー作成中にエラーが発生しました。' });
    }
};

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
        res.status(500).json({ message: 'オファー回答の更新に失敗しました。' });
    }
};

export const createQuotation = async (req, res) => {
    const { projectId, items } = req.body;
    const floristId = req.user.id;

    if (req.user.role !== 'FLORIST') return res.status(403).json({ message: '権限がありません。' });

    try {
        const offer = await prisma.offer.findFirst({ where: { projectId, floristId, status: 'ACCEPTED' } });
        if (!offer) return res.status(403).json({ message: '承諾済みのオファーが存在しません。' });

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
        res.status(500).json({ message: '見積書の作成に失敗しました。' });
    }
};

export const approveQuotation = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const result = await prisma.$transaction(async (tx) => {
            const quotation = await tx.quotation.findUnique({ where: { id }, include: { project: true } });
            if (!quotation || quotation.project.plannerId !== userId) throw new Error('権限がありません。');
            if (quotation.isApproved) throw new Error('既に承認済みです。');

            const project = quotation.project;
            if (project.collectedAmount < quotation.totalAmount) throw new Error('企画の集計金額が見積額に達していません。');

            const offer = await tx.offer.findUnique({ where: { projectId: project.id }, include: { florist: true } });
            
            const systemSettings = await tx.systemSettings.findFirst() || { platformFeeRate: 0.10 };
            const feeRate = offer.florist.customFeeRate ?? systemSettings.platformFeeRate ?? 0.10;
            const commission = Math.floor(quotation.totalAmount * feeRate);
            const netPayout = quotation.totalAmount - commission;

            await tx.florist.update({
                where: { id: offer.floristId },
                data: { balance: { increment: netPayout } },
            });
            await tx.commission.create({ data: { amount: commission, projectId: project.id } });
            
            const approved = await tx.quotation.update({
                where: { id },
                data: { isApproved: true }
            });

            await createNotification(offer.floristId, 'QUOTATION_APPROVED', `見積もりが承認されました。売上確定: ${netPayout.toLocaleString()}pt`, project.id, `/florists/offers/${offer.id}`);
            
            return approved;
        });
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

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
        res.status(500).json({ message: '見積の確定に失敗しました。' });
    }
};

// ==========================================
// ★★★ 3. お花屋さん管理 (Profile & Payouts) ★★★
// ==========================================

// ■ 2. 制作実績（ポートフォリオ）更新の修正
export const updateFloristProfile = async (req, res) => {
    const floristId = req.user.id;
    // ... (入力データの取得) ...
    const { portfolioImages, ...otherData } = req.body; // 画像配列を取り出す

    try {
        let dataToUpdate = { ...otherData };

        // ★修正: 画像配列が空でも更新できるように明示的に処理
        if (Array.isArray(portfolioImages)) {
            dataToUpdate.portfolioImages = portfolioImages;
        }

        const updated = await prisma.florist.update({
            where: { id: floristId },
            data: dataToUpdate
        });
        
        const { password, ...clean } = updated;
        res.status(200).json(clean);
    } catch (error) {
        console.error('Update Error:', error);
        res.status(500).json({ message: 'プロフィールの更新に失敗しました。' });
    }
};


// ■ 3. 銀行口座の登録・更新 (新規追加)
export const registerFloristBankAccount = async (req, res) => {
    const { bankName, branchName, accountType, accountNumber, accountHolder } = req.body;
    const floristId = req.user.id;

    try {
        const account = await prisma.bankAccount.upsert({
            where: { floristId: floristId },
            update: { bankName, branchName, accountType, accountNumber, accountHolder },
            create: {
                floristId: floristId,
                userId: null, // 明示的にnull
                bankName, branchName, accountType, accountNumber, accountHolder
            }
        });
        res.json(account);
    } catch (error) {
        console.error('Bank Account Error:', error);
        res.status(500).json({ message: '口座情報の保存に失敗しました' });
    }
};

// ■ 4. 銀行口座の取得 (新規追加)
export const getFloristBankAccount = async (req, res) => {
    try {
        const account = await prisma.bankAccount.findUnique({
            where: { floristId: req.user.id }
        });
        res.json(account || {});
    } catch (error) {
        res.status(500).json({ message: '取得失敗' });
    }
};

export const getPayouts = async (req, res) => {
    const floristId = req.user.id;
    if (req.user.role !== 'FLORIST') return res.status(403).json({ message: '権限がありません。' });
    try {
        const payouts = await prisma.payoutRequest.findMany({ where: { floristId }, orderBy: { createdAt: 'desc' } });
        res.status(200).json(payouts);
    } catch (error) {
        res.status(500).json({ message: '出金履歴の取得に失敗しました。' });
    }
};

export const requestPayout = async (req, res) => {
    const floristId = req.user.id;
    const { amount, accountInfo } = req.body;
    if (req.user.role !== 'FLORIST') return res.status(403).json({ message: '権限がありません。' });

    const payoutAmount = parseInt(amount, 10);
    if (isNaN(payoutAmount) || payoutAmount < 1000) return res.status(400).json({ message: '出金は1000ptから申請可能です。' });

    try {
        const result = await prisma.$transaction(async (tx) => {
            const florist = await tx.florist.findUnique({ where: { id: floristId } });
            if (florist.balance < payoutAmount) throw new Error('売上残高が不足しています。');

            await tx.florist.update({ where: { id: floristId }, data: { balance: { decrement: payoutAmount } } });
            return await tx.payoutRequest.create({
                data: { amount: payoutAmount, accountInfo, floristId, status: 'PENDING' }
            });
        });
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

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
        res.status(500).json({ message: 'スケジュールの取得に失敗しました。' });
    }
};

// ==========================================
// ★★★ 4. 投稿・特売・その他 ★★★
// ==========================================

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
        res.status(500).json({ message: 'アピール投稿の作成に失敗しました。' });
    }
};

export const likeFloristPost = async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;
    if (['FLORIST', 'VENUE', 'ADMIN'].includes(req.user.role)) return res.status(403).json({ message: 'お花屋さんや運営者はいいねできません。' });

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
        res.status(500).json({ message: 'いいね処理中にエラーが発生しました。' });
    }
};

let SPECIAL_DEALS = [];
export const createDeal = async (req, res) => {
    if (req.user.role !== 'FLORIST') return res.status(403).json({ message: '権限がありません。' });
    const { color, flower, discount, message } = req.body;
    
    try {
        const deal = await prisma.floristDeal.create({
            data: {
                floristId: req.user.id,
                color,
                flower,
                discount: parseInt(discount),
                message
            }
        });
        res.status(201).json(deal);
    } catch (error) {
        res.status(500).json({ message: 'キャンペーン作成に失敗しました' });
    }
};

export const getMyDeals = async (req, res) => {
    if (req.user.role !== 'FLORIST') return res.status(403).json({ message: '権限がありません。' });
    try {
        const deals = await prisma.floristDeal.findMany({
            where: { floristId: req.user.id },
            orderBy: { createdAt: 'desc' }
        });
        res.json(deals);
    } catch (error) {
        res.status(500).json({ message: '取得に失敗しました' });
    }
};

export const deleteDeal = async (req, res) => {
    const { id } = req.params;
    if (req.user.role !== 'FLORIST') return res.status(403).json({ message: '権限がありません。' });
    
    try {
        // 自分の投稿か確認
        const deal = await prisma.floristDeal.findUnique({ where: { id } });
        if (!deal || deal.floristId !== req.user.id) {
            return res.status(404).json({ message: '削除対象が見つかりません' });
        }
        
        await prisma.floristDeal.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: '削除に失敗しました' });
    }
};

export const searchDeals = async (req, res) => {
    const { keyword } = req.query;
    try {
        const where = keyword ? {
            OR: [
                { color: { contains: keyword, mode: 'insensitive' } },
                { flower: { contains: keyword, mode: 'insensitive' } },
                { message: { contains: keyword, mode: 'insensitive' } }
            ]
        } : {};

        const deals = await prisma.floristDeal.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { florist: { select: { shopName: true, platformName: true } } } // 店名も含めて返す
        });
        
        // フロントエンドの形式に合わせて整形
        const formatted = deals.map(d => ({
            ...d,
            floristName: d.florist.platformName || d.florist.shopName
        }));
        
        res.json(formatted);
    } catch (error) {
        res.status(500).json({ message: '検索に失敗しました' });
    }
};