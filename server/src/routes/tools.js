import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const router = express.Router();

// S3クライアントの設定
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    // 一部の環境でホスト名解決エラーを防ぐための設定
    forcePathStyle: false, 
});

// S3アップロード用の署名付きURLを発行
router.post('/s3-upload-url', authenticateToken, async (req, res) => {
    try {
        const { fileName, fileType } = req.body;
        
        if (!fileName || !fileType) {
            return res.status(400).json({ message: 'ファイル情報が不足しています。' });
        }

        // ファイル名を正規化
        const extension = fileName.split('.').pop();
        const fileKey = `events/${Date.now()}.${extension}`;

        const command = new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: fileKey,
            ContentType: fileType,
        });

        // 署名付きURLを生成 (expiresInは秒単位)
        const signedUrl = await getSignedUrl(s3Client, command, { 
            expiresIn: 300,
            // 署名に含めるヘッダーを明示的に制限する（ブラウザブロック対策）
            unhoistableHeaders: new Set(['content-type']), 
        });

        // レスポンスを返す
        res.json({ 
            uploadUrl: signedUrl, 
            fileUrl: `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}` 
        });
    } catch (err) {
        console.error("S3 Presigned URL Error:", err);
        res.status(500).json({ message: "署名付きURLの生成に失敗しました", error: err.message });
    }
});

export default router;