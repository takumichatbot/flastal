import express from 'express';
import * as projectController from '../controllers/projectController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// app.js で app.use('/api/projects', router) としている前提のパス設定

// ==========================================
// 公開用エンドポイント
// ==========================================
router.get('/', projectController.getProjects); // /api/projects
router.get('/featured', projectController.getFeaturedProjects); // /api/projects/featured
router.get('/successful-templates', projectController.getSuccessfulTemplates); // /api/projects/successful-templates
router.get('/:id', projectController.getProjectById); // /api/projects/:id
router.get('/:id/board', projectController.getProjectBoard); // /api/projects/:id/board
router.get('/:projectId/posts', projectController.getProjectPosts); // /api/projects/:projectId/posts

// ==========================================
// 企画者用エンドポイント
// ==========================================
router.post('/', authenticateToken, projectController.createProject); // /api/projects (POST)
router.patch('/:id', authenticateToken, projectController.updateProject); // /api/projects/:id (PATCH)
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
// その他
// ==========================================
router.post('/:projectId/posts', authenticateToken, projectController.createProjectPost); 

export default router;