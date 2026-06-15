import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import * as toolController from '../controllers/toolController.js';
import multer from 'multer';
import prisma from '../config/prisma.js'; // ★ 追加：データベース操作用

const router = express.Router();
const upload = multer();

// ==========================================
// ★ 追加: 一般ユーザー向けに予算カタログを返すエンドポイント
// （企画作成画面などで誰でも見れるように、ここは認証不要にしています）
// ==========================================
router.get('/budget-references', async (req, res) => {
    try {
        const refs = await prisma.budgetReferenceImage.findMany({
            where: { isActive: true }, // アクティブなものだけを返す
            orderBy: { createdAt: 'asc' }
        });
        res.json(refs);
    } catch (error) {
        console.error("Budget References Fetch Error:", error);
        res.status(500).json({ message: 'カタログの取得に失敗しました' });
    }
});

// S3署名付きURL発行
router.post('/s3-upload-url', authenticateToken, toolController.getS3UploadUrl);

// AI説明文生成 (エイリアス含め両方に対応)
router.post('/generate-plan-text', authenticateToken, toolController.generatePlanText);
router.post('/generate-plan', authenticateToken, toolController.generatePlanText); // ★ 追加：/api/ai/generate-plan 対応用

// AI画像生成
router.post('/generate-ai-image', authenticateToken, toolController.generateAiImage);

// 翻訳
router.post('/translate', authenticateToken, toolController.translateText);

// イベント情報解析
router.post('/parse-event', authenticateToken, toolController.parseEventInfo);

// ARパネル生成 (ファイルアップロードが必要なため)
router.post('/create-ar-panel', authenticateToken, upload.single('image'), toolController.createArPanel);

// Cloudinary直接アップロード
router.post('/upload-image', authenticateToken, upload.single('image'), toolController.uploadImage);

// 画像からお花屋さん検索
router.post('/search-florist-by-image', authenticateToken, upload.single('image'), toolController.searchFloristByImage);

// Web Push通知登録
router.post('/subscribe-push', authenticateToken, toolController.subscribePush);

// ネイティブ(APNs)デバイストークン登録
router.post('/native-device-token', authenticateToken, toolController.registerNativeDeviceToken);

export default router;