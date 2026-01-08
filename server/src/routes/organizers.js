import express from 'express';
import * as venueController from '../controllers/venueController.js';
import * as eventController from '../controllers/eventController.js'; // 追加
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// --- 主催者専用イベント管理 ---
// イベント一覧取得
router.get('/events', authenticateToken, venueController.getEvents); 

// ★ ここが重要：新規登録
// デザインや機能を変えず、共通の eventController.createEvent を使うようにマッピングします
router.post('/events', authenticateToken, eventController.createEvent);

// その他 (ログイン等、既存のルートがあればここに続く)
// router.post('/login', ...); 

export default router;