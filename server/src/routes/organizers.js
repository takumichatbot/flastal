import express from 'express';
import * as organizerController from '../controllers/organizerController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// ログイン (公開)
router.post('/login', organizerController.loginOrganizer);

// イベント一覧 (要認証)
router.get('/events', authenticateToken, organizerController.getOrganizerEvents);

export default router;