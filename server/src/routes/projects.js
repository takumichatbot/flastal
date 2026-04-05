import express from 'express';
import * as projectController from '../controllers/projectController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// ==========================================
// 公開用エンドポイント
// ==========================================
router.get('/', projectController.getProjects); 
router.get('/featured', projectController.getFeaturedProjects); 
router.get('/successful-templates', projectController.getSuccessfulTemplates); 
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

// ==========================================
// 進行・花屋連携
// ==========================================
router.patch('/:projectId/production', authenticateToken, projectController.updateProductionDetails);
router.patch('/:projectId/materials', authenticateToken, projectController.updateMaterialCost);
router.patch('/:projectId/production-status', authenticateToken, projectController.updateProductionStatus);
router.patch('/:projectId/status', authenticateToken, projectController.updateProjectStatus);
router.get('/:projectId/instruction-sheet', authenticateToken, projectController.getInstructionSheet);

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

export default router;