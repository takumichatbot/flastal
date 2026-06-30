import { Prisma } from '@prisma/client';
import prisma from '../config/prisma.js';
import OpenAI from 'openai';
import { createNotification, sendPushNotification } from '../utils/notification.js';
import { sendDynamicEmail } from '../utils/email.js';
import { withCache, cache } from '../utils/cache.js';
import { logger } from '../utils/logger.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ==========================================
// ★★★ 1. お花屋さん検索・取得 ★★★
// ==========================================

export const getFloristProfile = async (req, res) => {
    try {
        const floristId = req.user.id; 

        const florist = await prisma.florist.findUnique({
            where: { id: floristId },
            include: {
                offers: {
                    include: {
                        project: {
                            select: {
                                id: true, title: true, targetAmount: true,
                                deliveryDateTime: true, productionStatus: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!florist) {
            logger.warn(`ID: ${floristId} not found in florist table`, { context: 'FloristError', floristId, role: req.user.role });
            return res.status(404).json({ message: 'お花屋さん情報が見つかりません。アカウント権限を確認してください。' });
        }

        const appealPosts = await prisma.floristPost.findMany({
            where: { floristId: floristId },
            include: { _count: { select: { likes: true } } },
            orderBy: { createdAt: 'desc' }
        });

        const { password, laruBotApiKey, ...safeData } = florist;
        
        const responseData = {
            ...safeData,
            appealPosts: appealPosts,
            offers: florist.offers || []
        };

        res.status(200).json(responseData);

    } catch (error) {
        logger.error('getFloristProfile Error', { context: 'floristController', error: error.message });
        res.status(500).json({ message: 'サーバーエラーが発生しました。' });
    }
};

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
        logger.error('updateFloristPost Error', { context: 'floristController', error: error.message });
        res.status(500).json({ message: '更新に失敗しました。' });
    }
};

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
        logger.error('deleteFloristPost Error', { context: 'floristController', error: error.message });
        res.status(500).json({ message: '削除に失敗しました。' });
    }
};

export const getRecentFloristPosts = async (req, res) => {
    try {
        const posts = await prisma.floristPost.findMany({
            where: { isPublic: true },
            include: { florist: { select: { id: true, platformName: true, iconUrl: true } } },
            orderBy: { createdAt: 'desc' },
            take: 8
        });
        res.json(posts);
    } catch (error) {
        logger.error('getRecentFloristPosts Error', { context: 'floristController', error: error.message });
        res.status(500).json({ message: '投稿の取得に失敗しました。' });
    }
};



export const getFlorists = async (req, res) => {
    try {
        const { keyword, prefecture, rush, tag } = req.query;
        const kw = keyword?.trim();

        // キーワードあり → GIN全文検索 + ILIKE の OR（日本語対応）
        if (kw) {
            const kwLike = `%${kw}%`;
            const prefClause = prefecture?.trim()
                ? Prisma.sql`AND (f.address ILIKE ${`%${prefecture.trim()}%`} OR f."baseDeliveryArea" ILIKE ${`%${prefecture.trim()}%`})`
                : Prisma.empty;
            const rushClause = rush === 'true' ? Prisma.sql`AND f."acceptsRushOrders" = true` : Prisma.empty;
            const tagClause = tag?.trim() ? Prisma.sql`AND ${tag.trim()} = ANY(f.specialties)` : Prisma.empty;

            const results = await prisma.$queryRaw(Prisma.sql`
                SELECT f.id, f."platformName", f.portfolio, f.address, f."iconUrl",
                       f."portfolioImages", f.specialties, f."acceptsRushOrders",
                       f."baseDeliveryArea", f."baseDeliveryFee",
                       COUNT(r.id)::int AS "reviewCount",
                       0 AS "averageRating",
                       GREATEST(
                           similarity(f."platformName", ${kw}),
                           similarity(COALESCE(f.portfolio, ''), ${kw}) * 0.6,
                           CASE WHEN f."platformName" ILIKE ${kwLike} THEN 0.5 ELSE 0 END
                       ) AS _score
                FROM "Florist" f
                LEFT JOIN "Review" r ON r."floristId" = f.id
                WHERE f.status = 'APPROVED'
                  ${prefClause}
                  ${rushClause}
                  ${tagClause}
                  AND (
                    f."platformName" % ${kw}
                    OR f.portfolio % ${kw}
                    OR f."platformName" ILIKE ${kwLike}
                    OR f.portfolio ILIKE ${kwLike}
                  )
                GROUP BY f.id
                ORDER BY _score DESC, f."createdAt" DESC
                LIMIT 100
            `);
            return res.status(200).json(results);
        }

        const whereClause = { status: 'APPROVED' };

        // エリア検索
        if (prefecture?.trim()) {
            const areaKeyword = prefecture.trim();
            whereClause.OR = [
                { address: { contains: areaKeyword } },
                { baseDeliveryArea: { contains: areaKeyword } },
            ];
        }

        // タグ検索
        if (tag?.trim()) {
            whereClause.specialties = { has: tag.trim() };
        }

        // お急ぎ便
        if (rush === 'true') {
            whereClause.acceptsRushOrders = true;
        }

        // フィルタなし公開一覧は60秒キャッシュ
        const isFiltered = keyword || prefecture || tag || rush;
        const cacheKey = isFiltered ? null : 'florists:public';

        const florists = await withCache(cacheKey, () => prisma.florist.findMany({
            where: whereClause,
            select: {
                id: true,
                platformName: true,
                portfolio: true,
                address: true,
                iconUrl: true,
                portfolioImages: true,
                specialties: true,
                acceptsRushOrders: true,
                baseDeliveryArea: true,
                baseDeliveryFee: true,
                _count: { select: { reviews: true } }
            },
            orderBy: { createdAt: 'desc' },
        }), 60);

        const floristsWithRating = florists.map(florist => ({
            ...florist,
            reviewCount: florist._count.reviews,
            averageRating: 0,
            _count: undefined
        }));

        res.status(200).json(floristsWithRating);
    } catch (error) {
        logger.error('getFlorists Error', { context: 'floristController', error: error.message });
        res.status(500).json({ message: 'お花屋さんの取得中にエラーが発生しました。' });
    }
};


export const getFloristById = async (req, res) => {
    const { id } = req.params;
    try {
        const florist = await prisma.florist.findUnique({ where: { id } });
        if (!florist) return res.status(404).json({ message: '花屋が見つかりません。' });

        const [appealPosts, reviews, offers] = await Promise.all([
            prisma.floristPost.findMany({
                where: { floristId: id, isPublic: true },
                include: { likes: { select: { userId: true } }, _count: { select: { likes: true } } },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.review.findMany({
                where: { floristId: id },
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { id: true, handleName: true, iconUrl: true } },
                    project: { select: { id: true, title: true, imageUrl: true } },
                },
            }),
            prisma.offer.findMany({
                where: { floristId: id },
                select: { status: true, createdAt: true, updatedAt: true },
            }),
        ]);

        // レスポンス率・平均返答時間を集計
        const totalOffers = offers.length;
        const respondedOffers = offers.filter(o => o.status !== 'PENDING');
        const responseRate = totalOffers > 0 ? Math.round((respondedOffers.length / totalOffers) * 100) : null;
        const avgResponseHours = respondedOffers.length > 0
            ? Math.round(respondedOffers.reduce((sum, o) => sum + (new Date(o.updatedAt) - new Date(o.createdAt)), 0) / respondedOffers.length / (1000 * 60 * 60))
            : null;

        // パスワード・APIキー・管理者向けフィールドは除外し、公開情報のみセット
        const { password, laruBotApiKey, customFeeRate, stripeAccountId, ...publicData } = florist;

        publicData.appealPosts = appealPosts;
        publicData.reviews = reviews;
        publicData.responseRate = responseRate;
        publicData.avgResponseHours = avgResponseHours;
        
        // ★ 追加: 配送・回収設定のデフォルト値を保証してフロントに渡す
        publicData.deliverySettings = {
            baseArea: florist.baseDeliveryArea || '設定なし',
            baseFee: florist.baseDeliveryFee ?? 0,
            collectionType: florist.collectionType || 'INCLUDED',
            collectionFee: florist.collectionFee ?? 0,
            areaFees: florist.areaFees || [],
            conditionFees: florist.conditionFees || []
        };

        res.status(200).json(publicData);
    } catch (error) {
        logger.error('getFloristById Error', { context: 'floristController', error: error.message });
        res.status(500).json({ message: 'サーバーエラーが発生しました。' });
    }
};

export const matchFloristsByAi = async (req, res) => {
    const { designDetails, flowerTypes, prefecture } = req.body;
    const STYLE_TAGS = ['かわいい/キュート', 'クール/かっこいい', 'おしゃれ/モダン', '和風/和モダン', 'ゴージャス/豪華', 'パステルカラー', 'ビビッドカラー', 'バルーン装飾', 'ペーパーフラワー', '大型/連結', '卓上/楽屋花'];

    if (!designDetails && !flowerTypes) return res.json({ recommendedFlorists: [] });

    try {
        // AIでタグ抽出
        let targetTags = [];
        if (process.env.OPENAI_API_KEY) {
            const prompt = `以下の要望に合うタグを、選択肢の中から最大3つ抽出してカンマ区切りで出力してください。他の文字は一切含めないこと。\n要望: "${designDetails} ${flowerTypes}"\n選択肢: ${STYLE_TAGS.join(', ')}`;
            const completion = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 60,
            });
            targetTags = completion.choices[0].message.content.split(',').map(t => t.trim()).filter(Boolean);
        } else {
            targetTags = STYLE_TAGS.filter(tag => (designDetails + flowerTypes).includes(tag.split('/')[0]));
        }

        // 承認済み花屋を全件取得してスコアリング
        const allFlorists = await prisma.florist.findMany({
            where: { status: 'APPROVED' },
            select: {
                id: true, platformName: true, iconUrl: true,
                portfolioImages: true, specialties: true, prefecture: true,
                catchPhrase: true,
                reviews: { select: { rating: true } },
                offers: { select: { status: true, createdAt: true, updatedAt: true } },
                _count: {
                    select: {
                        reviews: true,
                        offers: {
                            where: { status: 'ACCEPTED' },
                        },
                    },
                },
            },
        });

        const scored = allFlorists.map(f => {
            // タグ一致スコア (1タグにつき+10点)
            const tagMatch = f.specialties.filter(s => targetTags.includes(s)).length;
            const tagScore = tagMatch * 10;

            // 評価スコア (0〜2点)
            const avgRating = f.reviews.length > 0
                ? f.reviews.reduce((s, r) => s + r.rating, 0) / f.reviews.length
                : 0;
            const ratingScore = (avgRating / 5) * 2;

            // 返答率スコア (0〜2点)
            const responded = f.offers.filter(o => o.status !== 'PENDING').length;
            const responseRate = f.offers.length > 0 ? responded / f.offers.length : 0;
            const responseScore = responseRate * 2;

            // 平均返答時間ボーナス (0〜10点)
            const respondedOffers = f.offers.filter(o => o.status !== 'PENDING');
            let responseTimeBonus = 0;
            if (respondedOffers.length > 0) {
                const avgResponseHours = respondedOffers.reduce(
                    (sum, o) => sum + (new Date(o.updatedAt) - new Date(o.createdAt)),
                    0
                ) / respondedOffers.length / (1000 * 60 * 60);
                if (avgResponseHours < 24) responseTimeBonus = 10;
                else if (avgResponseHours < 48) responseTimeBonus = 5;
            }

            // 実績スコア: ACCEPTEDオファー数 (最大+20点) + レビュー数 (最大+1点)
            const acceptedCount = f._count.offers ?? 0;
            const expScore = Math.min(acceptedCount * 2, 20) + Math.min(f._count.reviews / 10, 1);

            // 都道府県一致ボーナス (0〜1点)
            const prefScore = (prefecture && f.prefecture === prefecture) ? 1 : 0;

            const total = tagScore + ratingScore + responseScore + responseTimeBonus + expScore + prefScore;

            return {
                id: f.id,
                platformName: f.platformName,
                iconUrl: f.iconUrl,
                portfolioImages: f.portfolioImages,
                specialties: f.specialties,
                prefecture: f.prefecture,
                catchPhrase: f.catchPhrase,
                averageRating: avgRating > 0 ? Math.round(avgRating * 10) / 10 : null,
                reviewCount: f._count.reviews,
                responseRate: f.offers.length > 0 ? Math.round(responseRate * 100) : null,
                tagMatchCount: tagMatch,
                matchScore: Math.round(total * 10) / 10,
                _score: total,
            };
        });

        // スコア降順で上位6件を返す
        const recommended = scored
            .sort((a, b) => b._score - a._score)
            .slice(0, 6)
            .map(({ _score, ...f }) => f);

        res.json({ tags: targetTags, recommendedFlorists: recommended });
    } catch (error) {
        logger.error('AI Match Error', { context: 'floristController', error: error.message });
        res.status(500).json({ message: 'マッチング処理に失敗しました' });
    }
};

// ==========================================
// ★★★ 2. オファー & 見積もり (Business) ★★★
// ==========================================

export const createOffer = async (req, res) => {
    const { projectId, floristId } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!projectId || !floristId) {
        return res.status(400).json({ message: 'プロジェクトとお花屋さんの指定は必須です。' });
    }

    try {
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        
        if (!project) {
            return res.status(404).json({ message: '企画が見つかりません。' });
        }
        
        // ★大修正: 企画者本人、もしくは管理者（ADMIN）ならオファーを送れるように変更
        // userRole が ADMIN の場合は無条件で許可するよう論理を整理しました。
        if (project.plannerId !== userId && userRole !== 'ADMIN') {
            logger.error('Offer rejected', { context: 'floristController', plannerId: project.plannerId, userId, role: userRole });
            return res.status(403).json({ message: 'この企画にオファーを送る権限がありません。' });
        }

        const newOffer = await prisma.offer.create({
            data: {
                projectId,
                floristId,
                expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3日後
            }
        });
        
        await createNotification(floristId, 'NEW_OFFER', `新しいオファーが届きました！`, projectId, `/florists/offers/${newOffer.id}`);
        sendPushNotification(floristId, {
            title: '💌 新しいオファーが届きました',
            body: `「${project.title}」への出展オファーが届いています`,
            url: `/florists/dashboard`,
        }).catch(() => {});

        // フロリストへメール通知
        const floristForEmail = await prisma.florist.findUnique({ where: { id: floristId }, select: { email: true, platformName: true } });
        if (floristForEmail) {
            const deliveryDate = project.deliveryDateTime ? new Date(project.deliveryDateTime).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' }) : '未定';
            sendDynamicEmail(floristForEmail.email, 'OFFER_RECEIVED', {
                floristName: floristForEmail.platformName,
                projectTitle: project.title,
                eventDate: deliveryDate,
            });
        }

        res.status(201).json(newOffer);
    } catch (error) {
        if (error.code === 'P2002') return res.status(409).json({ message: '既にこのお花屋さんにオファーを送信済みです。' });
        logger.error('Create Offer Error', { context: 'floristController', error: error.message });
        res.status(500).json({ message: 'オファー作成中にエラーが発生しました。' });
    }
};

export const respondToOffer = async (req, res) => {
    const { offerId } = req.params;
    const { status, reason } = req.body;
    const floristId = req.user.id;

    if (req.user.role !== 'FLORIST') return res.status(403).json({ message: '権限がありません。' });

    try {
        const offer = await prisma.offer.findUnique({ where: { id: offerId } });
        if (!offer || offer.floristId !== floristId) return res.status(403).json({ message: '権限がありません。' });

        const updateData = { status };
        if (status === 'REJECTED') {
            updateData.declinationReason = reason || null;
        }

        const updatedOffer = await prisma.offer.update({
            where: { id: offerId },
            data: updateData,
            include: {
                project: { select: { id: true, plannerId: true, title: true } },
                chatRoom: true
            }
        });

        // プランナー情報を取得してメール送信
        const planner = await prisma.user.findUnique({ where: { id: updatedOffer.project.plannerId }, select: { email: true, handleName: true } });
        const floristInfo = await prisma.florist.findUnique({ where: { id: floristId }, select: { platformName: true } });

        if (status === 'ACCEPTED') {
            if (!updatedOffer.chatRoom) {
                await prisma.chatRoom.create({ data: { offerId: offerId } });
            }
            await createNotification(updatedOffer.project.plannerId, 'OFFER_ACCEPTED', `${floristInfo?.platformName || 'お花屋さん'}がオファーを承諾しました！`, updatedOffer.projectId, `/projects/${updatedOffer.projectId}/florist-chat`);
            sendPushNotification(updatedOffer.project.plannerId, {
                title: '✅ オファーが承認されました',
                body: `${floristInfo?.platformName || 'お花屋さん'}がオファーを承諾しました。見積もりをお待ちください`,
                url: `/projects/${updatedOffer.projectId}`,
            }).catch(() => {});
            if (planner) {
                sendDynamicEmail(planner.email, 'OFFER_ACCEPTED', {
                    plannerName: planner.handleName || 'さん',
                    floristName: floristInfo?.platformName || 'お花屋さん',
                    projectTitle: updatedOffer.project.title,
                });
            }
        } else if (status === 'REJECTED') {
            const reasonText = reason ? `（理由: ${reason}）` : '';
            await createNotification(
                updatedOffer.project.plannerId,
                'OFFER_REJECTED',
                `お花屋さんがオファーを辞退しました${reasonText}。別の花屋を探しましょう。`,
                updatedOffer.projectId,
                `/projects/${updatedOffer.projectId}/offers`
            );
            if (planner) {
                const declinationReasonBlock = reason
                    ? `<div class="highlight"><div class="highlight-label">辞退理由</div><div class="highlight-value" style="font-size:14px;font-weight:400;color:#475569;">${reason}</div></div>`
                    : '';
                sendDynamicEmail(planner.email, 'OFFER_DECLINED', {
                    plannerName: planner.handleName || 'さん',
                    floristName: floristInfo?.platformName || 'お花屋さん',
                    projectTitle: updatedOffer.project.title,
                    declinationReasonBlock,
                    searchUrl: `${process.env.FRONTEND_URL}/florists`,
                    projectId: updatedOffer.project.id,
                });
            }
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

    if (!projectId) {
        return res.status(400).json({ message: 'プロジェクトの指定は必須です。' });
    }
    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: '見積もり項目を1件以上入力してください。' });
    }
    for (const item of items) {
        if (!item.itemName || !String(item.itemName).trim()) {
            return res.status(400).json({ message: '各見積もり項目に品目名を入力してください。' });
        }
        const itemAmount = parseInt(item.amount);
        if (isNaN(itemAmount) || itemAmount < 1 || itemAmount > 50000000) {
            return res.status(400).json({ message: '各見積もり項目の金額は1〜50,000,000円の範囲で入力してください。' });
        }
    }
    const baseTotal = items.reduce((sum, item) => sum + parseInt(item.amount, 10), 0);
    if (baseTotal < 1000 || baseTotal > 50000000) {
        return res.status(400).json({ message: '見積もり合計金額は1,000〜50,000,000円の範囲で入力してください。' });
    }

    try {
        const offer = await prisma.offer.findFirst({ where: { projectId, floristId, status: 'ACCEPTED' } });
        if (!offer) return res.status(403).json({ message: '承諾済みのオファーが存在しません。' });

        const project = await prisma.project.findUnique({ where: { id: projectId } });
        
        const now = new Date();
        const deliveryDate = new Date(project.deliveryDateTime);
        const diffTime = deliveryDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        let baseAmount = items.reduce((sum, item) => sum + parseInt(item.amount, 10), 0);
        let rushFeeRate = 0;
        let rushFeeName = "";

        if (diffDays <= 1) {
            rushFeeRate = 0.30; 
            rushFeeName = "超特急対応料金 (前日・当日: 30%加算)";
        } else if (diffDays <= 3) {
            rushFeeRate = 0.20; 
            rushFeeName = "特急対応料金 (2〜3日前: 20%加算)";
        } else if (diffDays <= 7) {
            rushFeeRate = 0.10; 
            rushFeeName = "お急ぎ対応料金 (4〜7日前: 10%加算)";
        }

        const finalItems = [...items.map(item => ({ itemName: item.itemName, amount: parseInt(item.amount, 10) }))];
        let totalAmount = baseAmount;

        if (rushFeeRate > 0) {
            const rushFee = Math.floor(baseAmount * rushFeeRate);
            finalItems.push({ itemName: rushFeeName, amount: rushFee });
            totalAmount += rushFee; 
        }

        const newQuotation = await prisma.quotation.create({
            data: {
                projectId,
                totalAmount,
                items: { create: finalItems },
            },
            include: { items: true },
        });

        await createNotification(project.plannerId, 'QUOTATION_RECEIVED', 'お花屋さんから見積もりが届きました。', projectId, `/projects/${projectId}`);
        sendPushNotification(project.plannerId, {
            title: '📋 見積もりが届きました',
            body: 'お花屋さんから見積もりが届きました。確認してください',
            url: `/projects/${projectId}`,
        }).catch(() => {});

        res.status(201).json(newQuotation);
    } catch (error) {
        logger.error('Quotation Error', { context: 'floristController', error: error.message });
        res.status(500).json({ message: '見積書の作成に失敗しました。' });
    }
};

export const approveQuotation = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const { approvalMethod = 'FULL' } = req.body; 

    try {
        const result = await prisma.$transaction(async (tx) => {
            const quotation = await tx.quotation.findUnique({ where: { id }, include: { project: true } });
            
            if (quotation.project.plannerId !== userId && req.user.role !== 'ADMIN') {
                throw new Error('権限がありません。');
            }

            if (quotation.isApproved) throw new Error('既に承認済みです。');

            const project = quotation.project;
            let finalQuotationAmount = quotation.totalAmount;
            const shortfall = quotation.totalAmount - project.collectedAmount;

            if (approvalMethod === 'GUARANTEE') {
                if (shortfall > 0) {
                    const user = await tx.user.findUnique({ where: { id: userId } });
                    if (user.points < shortfall) {
                        throw new Error(`立替のためのポイントが足りません（不足額: ${shortfall.toLocaleString()}pt）。先にポイントをチャージしてください。`);
                    }
                    
                    await tx.user.update({
                        where: { id: userId },
                        data: { points: { decrement: shortfall }, totalPledgedAmount: { increment: shortfall } }
                    });
                    
                    await tx.project.update({
                        where: { id: project.id },
                        data: { collectedAmount: { increment: shortfall } }
                    });

                    await tx.pledge.create({
                        data: { amount: shortfall, projectId: project.id, userId: userId, comment: "企画進行のための立替支援" }
                    });
                }
            } else if (approvalMethod === 'FLEXIBLE') {
                if (project.collectedAmount < 1000) {
                    throw new Error('集まった金額が少なすぎるため、おまかせプランは適用できません（最低1000pt必要）。');
                }
                
                finalQuotationAmount = project.collectedAmount; 
                
                await tx.quotation.update({
                    where: { id },
                    data: { totalAmount: finalQuotationAmount }
                });
            } else {
                if (shortfall > 0) {
                    throw new Error('企画の集計金額が見積額に達していません。ポイント立替か、おまかせプランを選択してください。');
                }
            }

            const offer = await tx.offer.findUnique({ where: { projectId: project.id }, include: { florist: true } });
            
            const systemSettings = await tx.systemSettings.findFirst() || { platformFeeRate: 0.10 };
            const feeRate = offer.florist.customFeeRate ?? systemSettings.platformFeeRate ?? 0.10;
            const commission = Math.floor(finalQuotationAmount * feeRate);
            const netPayout = finalQuotationAmount - commission;

            await tx.florist.update({
                where: { id: offer.floristId },
                data: { balance: { increment: netPayout } },
            });

            await tx.commission.create({ data: { amount: commission, projectId: project.id } });
            logger.info('Quotation approved', { context: 'Commission', projectId: project.id, floristId: offer.floristId, totalAmount: finalQuotationAmount, feeRate, commissionAmount: commission, netPayout });

            const approved = await tx.quotation.update({
                where: { id },
                data: { isApproved: true }
            });

            await createNotification(
                offer.floristId,
                'QUOTATION_APPROVED',
                `見積もりが承認されました！制作を開始してください。(確定売上: ${netPayout.toLocaleString()}pt)`,
                project.id,
                `/florists/offers/${offer.id}`
            );
            sendPushNotification(offer.floristId, {
                title: '🎊 見積もりが承認されました！',
                body: `「${project.title}」の見積もりが承認されました`,
                url: `/florists/dashboard`,
            }).catch(() => {});

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

export const updateFloristProfile = async (req, res) => {
    const floristId = req.user.id;
    const { portfolioImages, ...otherData } = req.body; 

    try {
        let dataToUpdate = { ...otherData };

        if (Array.isArray(portfolioImages)) {
            dataToUpdate.portfolioImages = portfolioImages;
        }

        const updated = await prisma.florist.update({
            where: { id: floristId },
            data: dataToUpdate
        });
        
        cache.del('florists:public');
        const { password, laruBotApiKey, ...clean } = updated;
        res.status(200).json(clean);
    } catch (error) {
        logger.error('Update Error', { context: 'floristController', error: error.message });
        res.status(500).json({ message: 'プロフィールの更新に失敗しました。' });
    }
};

export const registerFloristBankAccount = async (req, res) => {
    const { bankName, branchName, accountType, accountNumber, accountHolder } = req.body;
    const floristId = req.user.id;

    try {
        const account = await prisma.bankAccount.upsert({
            where: { floristId: floristId },
            update: { bankName, branchName, accountType, accountNumber, accountHolder },
            create: {
                floristId: floristId,
                userId: null, 
                bankName, branchName, accountType, accountNumber, accountHolder
            }
        });
        res.json(account);
    } catch (error) {
        logger.error('Bank Account Error', { context: 'floristController', error: error.message });
        res.status(500).json({ message: '口座情報の保存に失敗しました' });
    }
};

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

    const MIN_PAYOUT = 5000;         // 最小出金額（pt）
    const MAX_MONTHLY_PAYOUT = 100000; // 月次出金上限（pt）

    const payoutAmount = parseInt(amount, 10);
    if (isNaN(payoutAmount) || payoutAmount < MIN_PAYOUT) {
        return res.status(400).json({ message: `出金は${MIN_PAYOUT.toLocaleString()}ptから申請可能です。` });
    }

    try {
        // 利用停止チェック
        const floristCheck = await prisma.florist.findUnique({ where: { id: floristId }, select: { status: true } });
        if (floristCheck?.status === 'SUSPENDED') {
            return res.status(403).json({ message: 'このアカウントは利用停止中のため、出金申請できません。' });
        }

        // 当月の出金申請合計を確認
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const monthlyAgg = await prisma.payoutRequest.aggregate({
            where: {
                floristId,
                createdAt: { gte: startOfMonth },
                status: { not: 'REJECTED' },
            },
            _sum: { amount: true },
        });
        const monthlyTotal = monthlyAgg._sum.amount || 0;

        if (monthlyTotal + payoutAmount > MAX_MONTHLY_PAYOUT) {
            const remaining = MAX_MONTHLY_PAYOUT - monthlyTotal;
            return res.status(400).json({
                message: `今月の出金上限（${MAX_MONTHLY_PAYOUT.toLocaleString()}pt）を超えています。残り${remaining.toLocaleString()}ptまで申請可能です。`,
            });
        }

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
            include: { florist: { select: { shopName: true, platformName: true } } } 
        });
        
        const formatted = deals.map(d => ({
            ...d,
            floristName: d.florist.platformName || d.florist.shopName
        }));
        
        res.json(formatted);
    } catch (error) {
        res.status(500).json({ message: '検索に失敗しました' });
    }
};



// --- 配送料金・回収費設定の取得 ---
export const getDeliverySettings = async (req, res) => {
    try {
        const florist = await prisma.florist.findUnique({
            where: { id: req.user.id },
            select: {
                baseDeliveryArea: true,
                baseDeliveryFee: true,
                collectionType: true,
                collectionFee: true,
                areaFees: true,
                conditionFees: true,
                deliveryNotes: true
            }
        });

        if (!florist) return res.status(404).json({ message: 'Florist not found' });

        res.json({
            baseArea: florist.baseDeliveryArea || '全国対応',
            baseFee: florist.baseDeliveryFee ?? 0,
            collectionType: florist.collectionType || 'INCLUDED',
            collectionFee: florist.collectionFee ?? 0,
            areaFees: florist.areaFees || [],
            conditionFees: florist.conditionFees || [],
            deliveryNotes: florist.deliveryNotes || ''
        });
    } catch (error) {
        logger.error('getDeliverySettings Error', { context: 'floristController', error: error.message });
        res.status(500).json({ message: '設定の取得に失敗しました' });
    }
};

// --- 配送料金・回収費設定の保存 ---
export const updateDeliverySettings = async (req, res) => {
    try {
        // 新しい変数名でデータを受け取る
        const { 
            baseArea, baseFee, 
            collectionType, collectionFee, 
            areaFees, conditionFees, deliveryNotes 
        } = req.body;

        await prisma.florist.update({
            where: { id: req.user.id },
            data: {
                // Prismaスキーマ上の名前に合わせて保存する
                baseDeliveryArea: baseArea || '全国対応',
                baseDeliveryFee: parseInt(baseFee) ?? 0,
                collectionType: collectionType || 'INCLUDED',
                collectionFee: parseInt(collectionFee) ?? 0,
                areaFees: Array.isArray(areaFees) ? areaFees : [],
                conditionFees: Array.isArray(conditionFees) ? conditionFees : [],
                deliveryNotes: deliveryNotes || ''
            }
        });

        res.json({ message: '設定を保存しました' });
    } catch (error) {
        logger.error('updateDeliverySettings Error', { context: 'floristController', error: error.message });
        res.status(500).json({ message: '設定の保存に失敗しました' });
    }
};
export const toggleFavorite = async (req, res) => {
    const { id: floristId } = req.params;
    const userId = req.user.id;
    try {
        const existing = await prisma.floristFavorite.findUnique({
            where: { userId_floristId: { userId, floristId } },
        });
        if (existing) {
            await prisma.floristFavorite.delete({ where: { userId_floristId: { userId, floristId } } });
            return res.json({ favorited: false });
        }
        await prisma.floristFavorite.create({ data: { userId, floristId } });
        res.json({ favorited: true });
    } catch (error) {
        logger.error('toggleFavorite Error', { context: 'floristController', error: error.message });
        res.status(500).json({ message: 'お気に入りの更新に失敗しました' });
    }
};

export const getMyFavorites = async (req, res) => {
    const userId = req.user.id;
    try {
        const favorites = await prisma.floristFavorite.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                florist: {
                    select: {
                        id: true, platformName: true, iconUrl: true,
                        portfolioImages: true, specialties: true,
                        baseDeliveryArea: true,
                        _count: { select: { reviews: true } },
                    },
                },
            },
        });
        res.json(favorites.map(f => ({ ...f.florist, reviewCount: f.florist._count.reviews, _count: undefined })));
    } catch (error) {
        logger.error('getMyFavorites Error', { context: 'floristController', error: error.message });
        res.status(500).json({ message: 'お気に入りの取得に失敗しました' });
    }
};

// ==========================================
// ★★★ 5. アナリティクス ★★★
// ==========================================

export const getFloristAnalytics = async (req, res) => {
    const floristId = req.user.id;
    if (req.user.role !== 'FLORIST') return res.status(403).json({ message: '権限がありません。' });

    try {
        const now = new Date();

        // 花屋プロフィール（残高取得）
        const floristProfile = await prisma.florist.findUnique({
            where: { id: floristId },
            select: { balance: true },
        });

        // 今月の開始・終了
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        // 承認済み見積もり（花屋が担当したプロジェクトの確定売上）
        const acceptedOffers = await prisma.offer.findMany({
            where: { floristId, status: 'ACCEPTED' },
            include: {
                project: {
                    select: {
                        id: true,
                        title: true,
                        collectedAmount: true,
                        productionStatus: true,
                        deliveryDateTime: true,
                        quotation: {
                            select: { totalAmount: true, isApproved: true, createdAt: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        // 全オファー（ステータス分布用）
        const allOffers = await prisma.offer.findMany({
            where: { floristId },
            select: { status: true, createdAt: true }
        });

        // レビュー一覧
        const reviews = await prisma.review.findMany({
            where: { floristId },
            include: {
                user: { select: { handleName: true, iconUrl: true } },
                project: { select: { title: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        // 月別集計（過去6ヶ月）
        const monthlyData = [];
        for (let i = 5; i >= 0; i--) {
            const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
            const label = `${monthStart.getMonth() + 1}月`;

            // その月に承認済みとなった見積もりの売上合計
            const monthOffers = acceptedOffers.filter(o => {
                const q = o.project?.quotation;
                if (!q || !q.isApproved) return false;
                const approvedDate = new Date(q.createdAt);
                return approvedDate >= monthStart && approvedDate <= monthEnd;
            });
            const monthRevenue = monthOffers.reduce((sum, o) => sum + (o.project?.quotation?.totalAmount || 0), 0);
            const monthOrderCount = monthOffers.length;

            // その月に作成されたオファー（受注件数トレンド）
            const monthAllOffers = allOffers.filter(o => {
                const d = new Date(o.createdAt);
                return d >= monthStart && d <= monthEnd;
            });

            monthlyData.push({
                month: label,
                revenue: monthRevenue,
                orders: monthOrderCount,
                totalOffers: monthAllOffers.length
            });
        }

        // 今月の売上・件数
        const thisMonthOffers = acceptedOffers.filter(o => {
            const q = o.project?.quotation;
            if (!q || !q.isApproved) return false;
            const d = new Date(q.createdAt);
            return d >= thisMonthStart && d <= thisMonthEnd;
        });
        const thisMonthRevenue = thisMonthOffers.reduce((sum, o) => sum + (o.project?.quotation?.totalAmount || 0), 0);
        const thisMonthOrderCount = thisMonthOffers.length;

        // 総担当プロジェクトのcollectedAmount合計
        const totalContribution = acceptedOffers.reduce((sum, o) => sum + (o.project?.collectedAmount || 0), 0);

        // オファーステータス分布
        const statusCounts = {
            PENDING: allOffers.filter(o => o.status === 'PENDING').length,
            ACCEPTED: allOffers.filter(o => o.status === 'ACCEPTED').length,
            REJECTED: allOffers.filter(o => o.status === 'REJECTED').length,
        };

        // 受注ステータス（productionStatus）分布
        const productionStatusCounts = {};
        acceptedOffers.forEach(o => {
            const s = o.project?.productionStatus || 'NOT_STARTED';
            productionStatusCounts[s] = (productionStatusCounts[s] || 0) + 1;
        });

        const totalEarnings = monthlyData.reduce((sum, m) => sum + (m.revenue || 0), 0);

        res.status(200).json({
            kpi: {
                thisMonthRevenue,
                thisMonthOrderCount,
                totalReviewCount: reviews.length,
                totalContribution,
                totalAcceptedOffers: acceptedOffers.length
            },
            monthlyData,
            offerStatusCounts: statusCounts,
            productionStatusCounts,
            recentReviews: reviews,
            balance: floristProfile?.balance ?? 0,
            totalEarnings,
        });
    } catch (error) {
        logger.error('getFloristAnalytics Error', { context: 'floristController', error: error.message });
        res.status(500).json({ message: 'アナリティクスデータの取得に失敗しました。' });
    }
};
