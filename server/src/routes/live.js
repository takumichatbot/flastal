import express from 'express';
import * as liveController from '../controllers/liveController.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

const requireFlorist = (req, res, next) => {
  if (req.user?.role === 'FLORIST') return next();
  res.status(403).json({ message: '花屋アカウントが必要です。' });
};

// 公開
router.get('/projects/:projectId/sessions', liveController.getSessions);
router.get('/sessions/:id', liveController.getSession);

// 花屋のみ
router.post('/sessions', authenticateToken, requireFlorist, liveController.createSession);
router.patch('/sessions/:id', authenticateToken, requireFlorist, liveController.updateSession);

// 視聴者数（認証不要）
router.get('/sessions/:id/viewer-count', liveController.getViewerCount);

// 視聴者（ログイン必須）
router.post('/sessions/:id/superchat', authenticateToken, liveController.sendSuperchat);

export default router;
