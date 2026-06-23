import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import * as templateController from '../controllers/templateController.js';

const router = express.Router();

// テンプレート一覧（自分のもの + 公開テンプレート）
router.get('/', authenticateToken, templateController.getTemplates);

// テンプレート作成
router.post('/', authenticateToken, templateController.createTemplate);

// テンプレートを使う（フォームへのデータ流し込み用）
router.get('/:id/use', authenticateToken, templateController.useTemplate);

// テンプレート削除
router.delete('/:id', authenticateToken, templateController.deleteTemplate);

export default router;
