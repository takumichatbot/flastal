import express from 'express';
import * as postController from '../controllers/postController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 投稿作成 (認証が必要な場合は authenticateToken を挟む)
router.post('/', authenticateToken, postController.createPost);

export default router;