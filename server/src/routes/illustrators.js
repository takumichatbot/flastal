import express from 'express';
import * as controller from '../controllers/illustratorController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 公開ルート
router.post('/register', controller.registerIllustrator);
router.post('/login', controller.loginIllustrator);

// 認証が必要なルート
router.get('/profile', authenticateToken, controller.getIllustratorProfile);
router.get('/dashboard', authenticateToken, controller.getDashboardData);

export default router;