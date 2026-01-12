import express from 'express';
import * as venueController from '../controllers/venueController.js';
import * as eventController from '../controllers/eventController.js';
import * as organizerController from '../controllers/organizerController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// --- 主催者プロフィール管理 ---
// プロフィール取得
router.get('/profile', authenticateToken, organizerController.getOrganizerProfile);

// 【重要】パスの不一致を解消するための修正
// フロントエンドが /api/organizers/profile を叩いても /api/organizers/:id を叩いても動作するようにします
router.patch('/profile', authenticateToken, organizerController.updateOrganizerProfile);
router.patch('/:id', authenticateToken, organizerController.updateOrganizerProfile);

// --- 主催者専用イベント管理 ---
router.get('/events', authenticateToken, organizerController.getOrganizerEvents); 
router.post('/events', authenticateToken, organizerController.createOrganizerEvent);
router.patch('/events/:id', authenticateToken, organizerController.updateOrganizerEvent);
router.delete('/events/:id', authenticateToken, organizerController.deleteOrganizerEvent);

// --- 会場情報の参照用 ---
router.get('/venues', venueController.getVenues);

export default router;