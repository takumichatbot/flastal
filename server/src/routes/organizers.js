import express from 'express';
import * as organizerController from '../controllers/organizerController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', organizerController.loginOrganizer);

// 主催者専用のイベント操作エンドポイント
router.get('/events', authenticateToken, organizerController.getOrganizerEvents);
router.post('/events', authenticateToken, organizerController.createOrganizerEvent);
router.patch('/events/:id', authenticateToken, organizerController.updateOrganizerEvent);
router.delete('/events/:id', authenticateToken, organizerController.deleteOrganizerEvent);

export default router;