import prisma from '../config/prisma.js';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from '../utils/logger.js';

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    forcePathStyle: false,
});

// S3 URL から Key を抽出するユーティリティ
function extractS3Key(url) {
    try {
        const parsed = new URL(url);
        // https://bucket.s3.region.amazonaws.com/key or https://s3.region.amazonaws.com/bucket/key
        const pathname = parsed.pathname; // "/key" or "/bucket/key"
        return pathname.startsWith('/') ? pathname.slice(1) : pathname;
    } catch {
        return null;
    }
}

const isBacker = async (projectId, userId) => {
    if (!userId) return false;
    const pledge = await prisma.pledge.findFirst({ where: { projectId, userId } });
    return !!pledge;
};

const isAuthorized = async (projectId, userId) => {
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { plannerId: true, members: { select: { userId: true } } },
    });
    if (!project) return false;
    return project.plannerId === userId || project.members.some(m => m.userId === userId);
};

export const getExclusiveContents = async (req, res) => {
    const { projectId } = req.params;
    const userId = req.user?.id;
    try {
        const [authorized, backerStatus] = await Promise.all([
            isAuthorized(projectId, userId),
            isBacker(projectId, userId),
        ]);
        if (!authorized && !backerStatus) {
            return res.status(403).json({ message: 'このコンテンツは支援者限定です' });
        }
        const contents = await prisma.exclusiveContent.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' },
        });
        res.json(contents);
    } catch {
        res.status(500).json({ message: '取得に失敗しました' });
    }
};

export const createExclusiveContent = async (req, res) => {
    const { projectId } = req.params;
    const { title, body, fileUrls = [], contentType = 'TEXT' } = req.body;
    const userId = req.user.id;

    if (!title?.trim()) return res.status(400).json({ message: 'タイトルは必須です' });
    if (!(await isAuthorized(projectId, userId))) {
        return res.status(403).json({ message: '権限がありません' });
    }
    try {
        const content = await prisma.exclusiveContent.create({
            data: { projectId, title, body, fileUrls, contentType },
        });
        res.status(201).json(content);
    } catch {
        res.status(500).json({ message: '作成に失敗しました' });
    }
};

export const deleteExclusiveContent = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    try {
        const content = await prisma.exclusiveContent.findUnique({
            where: { id },
            include: { project: { select: { plannerId: true } } },
        });
        if (!content) return res.status(404).json({ message: '見つかりません' });
        if (content.project.plannerId !== userId && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: '権限がありません' });
        }
        await prisma.exclusiveContent.delete({ where: { id } });
        res.json({ success: true });
    } catch {
        res.status(500).json({ message: '削除に失敗しました' });
    }
};

// GET /api/projects/:projectId/team/exclusive/:id/download
// 支援者チェック済みのS3 Presigned URL（有効期限24時間）を返す
export const getExclusiveContentDownloadUrl = async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id;
    try {
        const content = await prisma.exclusiveContent.findUnique({
            where: { id },
            include: { project: { select: { id: true, plannerId: true, members: { select: { userId: true } } } } },
        });
        if (!content) return res.status(404).json({ message: 'コンテンツが見つかりません' });

        const projectId = content.project.id;

        // 企画者・メンバーはそのままアクセス可
        const isAuthor =
            content.project.plannerId === userId ||
            content.project.members.some(m => m.userId === userId);

        if (!isAuthor) {
            // 支援者チェック
            const pledge = await prisma.pledge.findFirst({
                where: { projectId, userId },
            });
            if (!pledge) {
                return res.status(403).json({ message: 'このコンテンツは支援者限定です。' });
            }
        }

        // fileUrls が空の場合
        const fileUrls = content.fileUrls || [];
        if (!fileUrls.length) {
            return res.status(404).json({ message: 'ダウンロード可能なファイルがありません' });
        }

        // 各ファイルについてPresigned URLを生成（有効期限 24時間）
        const signedUrls = await Promise.all(
            fileUrls.map(async (url) => {
                const key = extractS3Key(url);
                if (!key) return { original: url, signedUrl: url };
                const command = new GetObjectCommand({
                    Bucket: process.env.AWS_S3_BUCKET_NAME,
                    Key: key,
                });
                const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 24 * 60 * 60 });
                return { original: url, signedUrl };
            })
        );

        res.json({ signedUrls });
    } catch (err) {
        logger.error('Download URL error', { context: 'ExclusiveContent', error: err.message });
        res.status(500).json({ message: 'ダウンロードURLの発行に失敗しました' });
    }
};
