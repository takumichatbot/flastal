import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const router = express.Router();

const s3Client = new S3Client({
    region: process.env.AWS_REGION, // "ap-northeast-1" であることを再確認してください
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    // 仮想ホスト形式 (bucket.s3.region.amazonaws.com) を使用
    forcePathStyle: false, 
});

router.post('/s3-upload-url', authenticateToken, async (req, res) => {
    try {
        const { fileName, fileType } = req.body;
        
        const extension = fileName.split('.').pop();
        const fileKey = `events/${Date.now()}.${extension}`;

        const command = new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: fileKey,
            ContentType: fileType,
        });

        // unhoistableHeaders を設定して、ブラウザが勝手にヘッダーを動かさないようにする
        const signedUrl = await getSignedUrl(s3Client, command, { 
            expiresIn: 300,
            unhoistableHeaders: new Set(['content-type']),
        });

        res.json({ 
            uploadUrl: signedUrl, 
            fileUrl: `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}` 
        });
    } catch (err) {
        console.error("S3 Error:", err);
        res.status(500).json({ message: "署名付きURLの生成に失敗しました" });
    }
});

export default router;