import prisma from '../config/prisma.js';
import { cache, withCache } from '../utils/cache.js';
import { logger } from '../utils/logger.js';

// キャッシュキーのプレフィックス
const CACHE_PREFIX = 'templates:';
// ユーザーごとのテンプレート一覧キャッシュ（TTL: 5分）
const TEMPLATES_LIST_TTL = 300;

// ==========================================
// テンプレート一覧取得（自分のテンプレート + isPublic=trueのもの）
// ==========================================
export const getTemplates = async (req, res) => {
    try {
        const userId = req.user.id;
        const cacheKey = `${CACHE_PREFIX}list:${userId}`;

        const result = await withCache(cacheKey, async () => {
            const templates = await prisma.projectTemplate.findMany({
                where: {
                    OR: [
                        { userId },
                        { isPublic: true },
                    ],
                },
                include: {
                    user: { select: { handleName: true, iconUrl: true } },
                },
                orderBy: [
                    { usageCount: 'desc' },
                    { createdAt: 'desc' },
                ],
            });

            // 自分のものかどうかフラグを付与
            return templates.map(t => ({
                ...t,
                isOwner: t.userId === userId,
            }));
        }, TEMPLATES_LIST_TTL);

        return res.status(200).json(result);
    } catch (err) {
        logger.error('getTemplates', { context: 'templateController', error: err.message });
        return res.status(500).json({ message: 'テンプレート一覧の取得に失敗しました。' });
    }
};

// ==========================================
// テンプレート作成（企画データから or 手入力）
// ==========================================
export const createTemplate = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            name,
            description,
            fromProjectId,
            targetAmount,
            targetArtist,
            projectType,
            tags,
            coverMessage,
            isPublic,
        } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'テンプレート名は必須です。' });
        }

        let templateData = {
            userId,
            name: name.trim(),
            description: description?.trim() || null,
            targetAmount: targetAmount || 0,
            targetArtist: targetArtist?.trim() || null,
            projectType: projectType || 'PUBLIC',
            tags: Array.isArray(tags) ? tags : [],
            coverMessage: coverMessage?.trim() || null,
            isPublic: Boolean(isPublic),
        };

        // fromProjectId が指定されている場合は企画データをコピー
        if (fromProjectId) {
            const sourceProject = await prisma.project.findUnique({
                where: { id: fromProjectId },
                select: {
                    plannerId: true,
                    targetAmount: true,
                    targetArtist: true,
                    projectType: true,
                    description: true,
                    tags: {
                        include: { tag: true },
                    },
                },
            });

            if (!sourceProject) {
                return res.status(404).json({ message: 'コピー元の企画が見つかりません。' });
            }
            if (sourceProject.plannerId !== userId) {
                return res.status(403).json({ message: '自分の企画からのみテンプレートを作成できます。' });
            }

            // 企画データで上書き（ユーザーが明示的に指定した値があれば優先しない）
            templateData = {
                ...templateData,
                targetAmount: targetAmount ?? sourceProject.targetAmount,
                targetArtist: targetArtist?.trim() || sourceProject.targetArtist || null,
                projectType: projectType || sourceProject.projectType?.toString() || 'PUBLIC',
                tags: Array.isArray(tags) && tags.length > 0
                    ? tags
                    : (sourceProject.tags?.map(pt => pt.tag?.name).filter(Boolean) || []),
                coverMessage: coverMessage?.trim() || sourceProject.description?.slice(0, 500) || null,
            };
        }

        if (!templateData.targetAmount || templateData.targetAmount <= 0) {
            return res.status(400).json({ message: '目標金額を入力してください。' });
        }

        const template = await prisma.projectTemplate.create({
            data: templateData,
            include: {
                user: { select: { handleName: true, iconUrl: true } },
            },
        });

        // テンプレート一覧キャッシュを無効化（作成者の一覧に新テンプレートが反映されるよう）
        cache.del(`${CACHE_PREFIX}list:${userId}`);

        return res.status(201).json(template);
    } catch (err) {
        logger.error('createTemplate', { context: 'templateController', error: err.message });
        return res.status(500).json({ message: 'テンプレートの作成に失敗しました。' });
    }
};

// ==========================================
// テンプレートを使う（データJSON返却 + usageCountインクリメント）
// ==========================================
export const useTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const template = await prisma.projectTemplate.findUnique({
            where: { id },
        });

        if (!template) {
            return res.status(404).json({ message: 'テンプレートが見つかりません。' });
        }

        // 自分のテンプレートか、公開テンプレートのみ使用可
        if (template.userId !== userId && !template.isPublic) {
            return res.status(403).json({ message: 'このテンプレートを使用する権限がありません。' });
        }

        // usageCount をインクリメント（自分のテンプレートでない場合のみ）
        if (template.userId !== userId) {
            await prisma.projectTemplate.update({
                where: { id },
                data: { usageCount: { increment: 1 } },
            });

            // テンプレートオーナーの一覧キャッシュを無効化（usageCountが更新されたため）
            cache.del(`${CACHE_PREFIX}list:${template.userId}`);
        }

        // 使用者自身の一覧キャッシュも無効化
        cache.del(`${CACHE_PREFIX}list:${userId}`);

        return res.status(200).json({
            targetAmount: template.targetAmount,
            targetArtist: template.targetArtist,
            projectType: template.projectType,
            tags: template.tags,
            coverMessage: template.coverMessage,
            description: template.description,
        });
    } catch (err) {
        logger.error('useTemplate', { context: 'templateController', error: err.message });
        return res.status(500).json({ message: 'テンプレートの取得に失敗しました。' });
    }
};

// ==========================================
// テンプレート削除（自分のもののみ）
// ==========================================
export const deleteTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const template = await prisma.projectTemplate.findUnique({
            where: { id },
            select: { userId: true },
        });

        if (!template) {
            return res.status(404).json({ message: 'テンプレートが見つかりません。' });
        }
        if (template.userId !== userId) {
            return res.status(403).json({ message: '自分のテンプレートのみ削除できます。' });
        }

        await prisma.projectTemplate.delete({ where: { id } });

        // 削除後にキャッシュを無効化
        cache.del(`${CACHE_PREFIX}list:${userId}`);

        return res.status(200).json({ message: 'テンプレートを削除しました。' });
    } catch (err) {
        logger.error('deleteTemplate', { context: 'templateController', error: err.message });
        return res.status(500).json({ message: 'テンプレートの削除に失敗しました。' });
    }
};
