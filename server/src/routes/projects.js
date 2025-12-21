import express from 'express';
import * as projectController from '../controllers/projectController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// ==========================================
// 公開用エンドポイント ( /api/projects... )
// ==========================================
router.get('/projects', projectController.getProjects); // 検索
router.get('/projects/featured', projectController.getFeaturedProjects); // 注目
router.get('/projects/successful-templates', projectController.getSuccessfulTemplates); // 成功事例
router.get('/projects/:id', projectController.getProjectById); // 詳細
router.get('/projects/:id/board', projectController.getProjectBoard); // デジタルネームボード
router.get('/projects/:projectId/posts', projectController.getProjectPosts); // 成功ストーリー一覧

// ==========================================
// 企画者用エンドポイント ( /api/projects... )
// ==========================================
router.post('/projects', authenticateToken, projectController.createProject); // 作成
router.patch('/projects/:id', authenticateToken, projectController.updateProject); // 編集
router.patch('/projects/:projectId/target-amount', authenticateToken, projectController.updateTargetAmount); // 目標金額変更
router.post('/projects/:projectId/tiers', authenticateToken, projectController.setPledgeTiers); // 支援コース設定
router.patch('/projects/:projectId/complete', authenticateToken, projectController.completeProject); // 完了報告
router.patch('/projects/:projectId/cancel', authenticateToken, projectController.cancelProject); // 中止・キャンセル

// ==========================================
// 進行・花屋連携 ( /api/projects... )
// ==========================================
// 制作状況の更新（パネル画像など） - 企画者＆花屋共通
router.patch('/projects/:projectId/production', authenticateToken, projectController.updateProductionDetails);

// 資材費更新 - 花屋用
router.patch('/projects/:projectId/materials', authenticateToken, projectController.updateMaterialCost);

// 制作ステータス更新 (詳細) - 花屋用
router.patch('/projects/:projectId/production-status', authenticateToken, projectController.updateProductionStatus);

// 汎用ステータス更新 - 管理者/花屋用
router.patch('/projects/:projectId/status', authenticateToken, projectController.updateProjectStatus);

// 指示書データ取得 - 花屋/企画者用
router.get('/projects/:projectId/instruction-sheet', authenticateToken, projectController.getInstructionSheet);

// ==========================================
// その他 ( /api/projects... )
// ==========================================
router.post('/projects/:projectId/posts', authenticateToken, projectController.createProjectPost); // ストーリー投稿

export default router;