import express from 'express';
import * as adminController from '../controllers/adminController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * 全ての管理ルートに認証とAdmin権限を強制
 */
router.use(authenticateToken);
router.use(requireAdmin);

// --- 1. 固定パス ---
router.get('/projects/pending', (req, res) => { req.params.type = 'projects'; adminController.getPendingItems(req, res); });
router.get('/florists/pending', (req, res) => { req.params.type = 'florists'; adminController.getPendingItems(req, res); });
router.get('/venues/pending', (req, res) => { req.params.type = 'venues'; adminController.getPendingItems(req, res); });
router.get('/organizers/pending', (req, res) => { req.params.type = 'organizers'; adminController.getPendingItems(req, res); });

router.get('/projects', adminController.getAllProjectsAdmin);
router.get('/florists/all', adminController.getAllFloristsAdmin);

router.get('/chat-reports', (req, res) => { req.params.type = 'chat'; adminController.getReports(req, res); });
router.get('/event-reports', (req, res) => { req.params.type = 'events'; adminController.getReports(req, res); });

// --- 2. ID指定のパス ---
// ★重要修正: フロントエンドのリクエスト /projects/:id/chats に対応
router.get('/projects/:projectId/chats', adminController.getProjectChatLogs);
router.get('/projects/:projectId/chat-logs', adminController.getProjectChatLogs); // 互換性のため維持

router.patch('/projects/:id/status', (req, res) => { req.params.type = 'projects'; adminController.approveItem(req, res); });
router.patch('/florists/:id/status', (req, res) => { req.params.type = 'florists'; adminController.approveItem(req, res); });
router.patch('/venues/:id/status', (req, res) => { req.params.type = 'venues'; adminController.approveItem(req, res); });
router.patch('/organizers/:id/status', (req, res) => { req.params.type = 'organizers'; adminController.approveItem(req, res); });

router.get('/florists/:id/fee', adminController.getFloristFee);
router.patch('/florists/:id/fee', adminController.updateFloristFee);
router.get('/florists/:id', adminController.getFloristByIdAdmin);

// --- 3. その他システム機能 ---
router.get('/settings', adminController.getSystemSettings);
router.patch('/settings', adminController.updateSystemSettings);
router.get('/commissions', adminController.getCommissions);
router.get('/payouts', adminController.getAdminPayouts);
router.patch('/payouts/:id', adminController.updateAdminPayoutStatus);
router.get('/email-templates', adminController.getEmailTemplates);
router.post('/email-templates', adminController.saveEmailTemplate);
router.post('/send-email', adminController.sendIndividualEmail);
router.patch('/reports/:reportId/review', adminController.reviewReport);

router.post('/chat-rooms', adminController.createAdminChatRoom);
router.get('/chat-rooms/:roomId/messages', adminController.getAdminChatMessages);

router.get('/users/search', adminController.searchAllUsers);
router.patch('/projects/:projectId/visibility', adminController.updateProjectVisibility);

router.post('/venues', adminController.createVenueAdmin);
router.patch('/venues/:id', adminController.updateVenueAdmin);
router.delete('/venues/:id', adminController.deleteVenueAdmin);

export default router;