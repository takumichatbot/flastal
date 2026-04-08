// src/routes/illustrators.js
import express from 'express';
import * as controller from '../controllers/illustratorController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// ==========================
// 公開ルート (認証不要)
// ==========================
router.post('/register', controller.registerIllustrator);
router.post('/login', controller.loginIllustrator);
router.get('/', controller.getIllustratorsList); // 絵師一覧の取得
router.get('/:id', controller.getIllustratorDetail); // 絵師の詳細取得

// ==========================
// 認証が必要なルート (絵師・企画者用)
// ==========================

// プロフィール管理 (絵師用)
router.get('/profile/me', authenticateToken, controller.getMyProfile);
router.put('/profile', authenticateToken, controller.updateMyProfile);

// ダッシュボード統計とプロジェクト (絵師用)
router.get('/dashboard/stats', authenticateToken, controller.getDashboardStats);
router.get('/projects', authenticateToken, controller.getMyActiveProjects);

// オファー機能
router.get('/offers', authenticateToken, controller.getMyOffers); // 届いたオファー一覧
router.post('/offers', authenticateToken, controller.sendOffer); // 企画者がオファーを送信
router.patch('/offers/:id/accept', authenticateToken, controller.acceptOffer); // 絵師が承認
router.patch('/offers/:id/reject', authenticateToken, controller.rejectOffer); // 絵師が辞退

// 立候補機能
router.get('/applications', authenticateToken, controller.getMyApplications); // 絵師の応募履歴
router.post('/applications', authenticateToken, controller.applyForRecruitment); // 絵師が立候補する

export default router;