import express from 'express';
import * as adminController from '../controllers/adminController.js';
import * as projectController from '../controllers/projectController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// 【最重要】まず「誰か」を特定してから、「管理者か」をチェックする順序にする
router.use(authenticateToken); 
router.use(requireAdmin);

// ==========================================
// ★★★ 1. プロジェクト管理 (Projects) ★★★
// ==========================================

router.get('/projects/pending', (req, res) => {
    req.params.type = 'projects';
    adminController.getPendingItems(req, res);
});

router.get('/projects', adminController.getAllProjectsAdmin);
router.patch('/projects/:projectId/status', projectController.updateProjectStatus);
router.patch('/projects/:projectId/visibility', adminController.updateProjectVisibility);
router.get('/projects/:projectId/chats', adminController.getProjectChatLogs);

// ==========================================
// ★★★ 2. 審査・承認 (Generic Approval) ★★★
// ==========================================

router.get('/:type/pending', adminController.getPendingItems);

router.patch('/florists/:id/status', (req, res) => { req.params.type = 'florists'; adminController.approveItem(req, res); });
router.patch('/venues/:id/status', (req, res) => { req.params.type = 'venues'; adminController.approveItem(req, res); });
router.patch('/organizers/:id/status', (req, res) => { req.params.type = 'organizers'; adminController.approveItem(req, res); });

// ==========================================
// ★★★ 3. その他管理機能 ★★★
// ==========================================

router.get('/commissions', adminController.getCommissions);
router.get('/settings', adminController.getSystemSettings);
router.patch('/settings', adminController.updateSystemSettings);
router.get('/florists/:floristId/fee', adminController.getFloristFee);
router.patch('/florists/:floristId/fee', adminController.updateFloristFee);
router.get('/payouts', adminController.getAdminPayouts);
router.patch('/payouts/:id', adminController.updateAdminPayoutStatus);

router.get('/reports', (req, res) => { req.params.type = 'events'; adminController.getReports(req, res); });
router.get('/event-reports', (req, res) => { req.params.type = 'events'; adminController.getReports(req, res); });
router.get('/chat-reports', (req, res) => { req.params.type = 'chat'; adminController.getReports(req, res); });

router.patch('/reports/:reportId/review', adminController.reviewReport);
router.patch('/event-reports/:reportId/dismiss', adminController.dismissEventReport);

router.get('/email-templates', adminController.getEmailTemplates);
router.post('/email-templates', adminController.saveEmailTemplate);
router.post('/send-individual-email', adminController.sendIndividualEmail);
router.get('/users/search', adminController.searchAllUsers);
router.post('/chat-rooms', adminController.createAdminChatRoom);
router.get('/chat-rooms/:roomId/messages', adminController.getAdminChatMessages);

router.patch('/events/:eventId/ban', adminController.banEvent);
router.post('/venues', adminController.createVenueAdmin);
router.patch('/venues/:id', adminController.updateVenueAdmin);
router.delete('/venues/:id', adminController.deleteVenueAdmin);

export default router;