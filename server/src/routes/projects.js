import express from 'express';
import * as projectController from '../controllers/projectController.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// ==========================================
// 公開用エンドポイント
// ==========================================
router.get('/', optionalAuth, projectController.getProjects);
router.get('/ranking/monthly', projectController.getMonthlyRanking);
router.get('/feed/personalized', optionalAuth, projectController.getPersonalizedFeed);
router.get('/featured', projectController.getFeaturedProjects); 
router.get('/successful-templates', projectController.getSuccessfulTemplates); 
router.get('/:id/stats', projectController.getProjectStats);
router.get('/:id/qr', projectController.getProjectQR);
router.get('/:id/analytics', authenticateToken, projectController.getProjectAnalytics);
router.get('/:id/export/pledges', authenticateToken, projectController.exportPledgesCSV);
router.get('/:id/florist-match', authenticateToken, projectController.matchFlorists);
router.get('/:id/sponsors', projectController.getSponsors);
router.post('/:id/sponsors', projectController.applyAsSponsor);
router.get('/:id', projectController.getProjectById);
router.get('/:id/board', projectController.getProjectBoard); 
router.get('/:projectId/posts', projectController.getProjectPosts); 

// ==========================================
// 企画者用エンドポイント
// ==========================================
router.post('/', authenticateToken, projectController.createProject); 
router.patch('/:id', authenticateToken, projectController.updateProject); 
router.patch('/:projectId/target-amount', authenticateToken, projectController.updateTargetAmount); 
router.post('/:projectId/tiers', authenticateToken, projectController.setPledgeTiers); 
router.patch('/:projectId/complete', authenticateToken, projectController.completeProject);
router.patch('/:projectId/cancel', authenticateToken, projectController.cancelProject);
router.patch('/:projectId/deadline', authenticateToken, projectController.updateDeadline);

// ==========================================
// 進行・花屋連携
// ==========================================
router.patch('/:projectId/production', authenticateToken, projectController.updateProductionDetails);
router.patch('/:projectId/materials', authenticateToken, projectController.updateMaterialCost);
router.patch('/:projectId/production-status', authenticateToken, projectController.updateProductionStatus);
router.patch('/:projectId/status', authenticateToken, projectController.updateProjectStatus);
router.get('/:projectId/instruction-sheet', authenticateToken, projectController.getInstructionSheet);
router.patch('/:projectId/logistics', authenticateToken, projectController.updateLogisticsStatus);

// ==========================================
// ★ クリエイター（絵師）連携
// ==========================================
// 届いた立候補を採用し仮払いする
router.patch('/:projectId/applications/:applicationId/accept', authenticateToken, projectController.acceptIllustratorApplication);
// 納品されたイラストを検収（ポイント支払い）する
router.post('/:projectId/illustration/accept', authenticateToken, projectController.acceptIllustrationDelivery);

// ==========================================
// その他
// ==========================================
router.post('/:projectId/posts', authenticateToken, projectController.createProjectPost);

// ==========================================
// ★ 参加証明書PDF
// ==========================================
router.get('/:id/certificate/:pledgeId', authenticateToken, projectController.generateCertificate);

// ==========================================
// ★ 一斉メッセージ送信
// ==========================================
router.post('/:id/broadcast', authenticateToken, projectController.broadcastMessage);

// ==========================================
// ★ 公式リアクション (OfficialReaction)
// ==========================================
router.post('/:id/official-react', authenticateToken, projectController.officialReact);
router.get('/:id/official-status', authenticateToken, projectController.getOfficialStatus);

// タグ
import * as tagCtrl from '../controllers/tagController.js';
router.get('/tags',                  tagCtrl.getUsedTags);   // GET /api/projects/tags → 公開企画で使われているタグ一覧
router.get('/tags/all',              tagCtrl.getAllTags);
router.get('/tags/used',             tagCtrl.getUsedTags);   // 公開企画で実際に使われているタグ
router.get('/:projectId/tags',       tagCtrl.getProjectTags);
router.put('/:projectId/tags',       authenticateToken, tagCtrl.setProjectTags);

export default router;