import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const router = express.Router();

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

// S3アップロード用の署名付きURLを発行
router.post('/s3-upload-url', authenticateToken, async (req, res) => {
    const { fileName, fileType } = req.body;
    
    // 重要: ファイル名の特殊文字によるエラーを防ぐため、キーをシンプルに生成
    const extension = fileName.split('.').pop();
    const fileKey = `events/${Date.now()}.${extension}`;

    const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: fileKey,
        ContentType: fileType, // フロントエンドの file.type と厳密に一致させる必要があります
    });

    try {
        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
        res.json({ 
            uploadUrl: signedUrl, 
            fileUrl: `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}` 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "署名付きURLの生成に失敗しました" });
    }
});

export default router;