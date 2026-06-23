import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import * as feedController from '../controllers/feedController.js';

const router = express.Router();

// アクティビティフィード取得
router.get('/', authenticateToken, feedController.getFeed);

// ユーザーフォロー / アンフォロー
router.post('/follow/user', authenticateToken, feedController.toggleUserFollow);

// アーティストページフォロー / アンフォロー
router.post('/follow/artist', authenticateToken, feedController.toggleArtistFollow);

// フォロー状態確認 (?artistPageId=xxx or ?followingId=xxx)
router.get('/follow/status', authenticateToken, feedController.getFollowStatus);

export default router;
