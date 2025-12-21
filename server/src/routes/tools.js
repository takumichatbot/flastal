import express from 'express';
import * as toolController from '../controllers/toolController.js';
import { authenticateToken } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// AR & 画像
router.post('/ar/create-panel', upload.single('image'), toolController.createArPanel);
router.post('/ai/generate-image', authenticateToken, toolController.generateAiImage);
router.post('/upload', authenticateToken, upload.single('image'), toolController.uploadImage);

// AI解析・テキスト
router.post('/translate', authenticateToken, toolController.translateText);
router.post('/ai/generate-plan', authenticateToken, toolController.generatePlanText);
router.post('/events/ai-parse', authenticateToken, toolController.parseEventInfo);

// AI画像検索 (Vision)
router.post('/ai/search-florist-by-image', upload.single('image'), toolController.searchFloristByImage);

// Push通知
router.post('/push/subscribe', authenticateToken, toolController.subscribePush);
router.post('/push/test', authenticateToken, toolController.sendTestPush);

export default router;