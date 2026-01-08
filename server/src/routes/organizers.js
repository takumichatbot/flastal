import express from 'express';
import * as venueController from '../controllers/venueController.js';
import * as eventController from '../controllers/eventController.js'; // 追加
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// --- 主催者専用イベント管理 ---
// イベント一覧取得: eventControllerから取得するように修正
router.get('/events', authenticateToken, eventController.getEvents); 

// 新規登録: eventControllerの関数を使用
router.post('/events', authenticateToken, eventController.createEvent);

// --- 会場情報の参照用 ---
router.get('/venues', venueController.getVenues);

export default router;