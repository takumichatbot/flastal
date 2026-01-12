import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import * as toolController from '../controllers/toolController.js';
import multer from 'multer';

const router = express.Router();
const upload = multer();

// S3署名付きURL発行
router.post('/s3-upload-url', authenticateToken, toolController.getS3UploadUrl);

// AI説明文生成
router.post('/generate-plan-text', authenticateToken, toolController.generatePlanText);

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

// Push通知登録
router.post('/subscribe-push', authenticateToken, toolController.subscribePush);

export default router;