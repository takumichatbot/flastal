import express from 'express';
import * as adminController from '../controllers/adminController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireAdmin);

// --- 1. 静的・固定パス (優先順位：最高) ---
router.get('/projects/pending', (req, res) => { req.params.type = 'projects'; adminController.getPendingItems(req, res); });
router.get('/florists/pending', (req, res) => { req.params.type = 'florists'; adminController.getPendingItems(req, res); });
router.get('/venues/pending', (req, res) => { req.params.type = 'venues'; adminController.getPendingItems(req, res); });
router.get('/organizers/pending', (req, res) => { req.params.type = 'organizers'; adminController.getPendingItems(req, res); });

router.get('/projects', adminController.getAllProjectsAdmin);
router.get('/florists/all', adminController.getAllFloristsAdmin);

router.get('/chat-reports', (req, res) => { req.params.type = 'chat'; adminController.getReports(req, res); });
router.get('/event-reports', (req, res) => { req.params.type = 'events'; adminController.getReports(req, res); });

router.get('/settings', adminController.getSystemSettings);
router.get('/commissions', adminController.getCommissions);
router.get('/payouts', adminController.getAdminPayouts);
router.get('/email-templates', adminController.getEmailTemplates);

// --- 2. 動的IDパス (優先順位：中) ---

// ★チャット監視画面用: フロントエンドのリクエスト /projects/:projectId/chats に対応
router.get('/projects/:projectId/chats', adminController.getProjectChatLogs);

router.patch('/projects/:id/status', (req, res) => { req.params.type = 'projects'; adminController.approveItem(req, res); });
router.patch('/florists/:id/status', (req, res) => { req.params.type = 'florists'; adminController.approveItem(req, res); });
router.patch('/venues/:id/status', (req, res) => { req.params.type = 'venues'; adminController.approveItem(req, res); });
router.patch('/organizers/:id/status', (req, res) => { req.params.type = 'organizers'; adminController.approveItem(req, res); });

router.get('/florists/:id/fee', adminController.getFloristFee);
router.patch('/florists/:id/fee', adminController.updateFloristFee);
router.get('/florists/:id', adminController.getFloristByIdAdmin);

// --- 3. その他・汎用 (優先順位：低) ---
router.get('/pending/:type', adminController.getPendingItems);
router.post('/approve/:type/:id', adminController.approveItem);
router.patch('/settings', adminController.updateSystemSettings);
router.patch('/payouts/:id', adminController.updateAdminPayoutStatus);
router.post('/email-templates', adminController.saveEmailTemplate);
router.post('/send-email', adminController.sendIndividualEmail);
router.patch('/reports/:reportId/review', adminController.reviewReport);
router.post('/chat-rooms', adminController.createAdminChatRoom);
router.get('/chat-rooms/:roomId/messages', adminController.getAdminChatMessages);
router.get('/users/search', adminController.searchAllUsers);
router.patch('/projects/:projectId/visibility', adminController.updateProjectVisibility);

export default router;