import express from 'express';
import * as adminController from '../controllers/adminController.js';
import * as eventController from '../controllers/eventController.js'; // ★ 追加: イベントコントローラーをインポート
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireAdmin);

// --- 1. 静的・固定パス (優先順位：最高) ---
router.get('/projects/pending', (req, res) => { req.params.type = 'projects'; adminController.getPendingItems(req, res); });
router.get('/florists/pending', (req, res) => { req.params.type = 'florists'; adminController.getPendingItems(req, res); });
router.get('/illustrators/pending', (req, res) => { req.params.type = 'illustrators'; adminController.getPendingItems(req, res); });
router.get('/venues/pending', (req, res) => { req.params.type = 'venues'; adminController.getPendingItems(req, res); });
router.get('/organizers/pending', (req, res) => { req.params.type = 'organizers'; adminController.getPendingItems(req, res); });

router.get('/projects', adminController.getAllProjectsAdmin);
router.get('/florists/all', adminController.getAllFloristsAdmin);

// ★ 追加: 全イベントの取得
router.get('/events', eventController.getEvents);

router.get('/chat-reports', (req, res) => { req.params.type = 'chat'; adminController.getReports(req, res); });
router.get('/event-reports', (req, res) => { req.params.type = 'events'; adminController.getReports(req, res); });

router.get('/settings', adminController.getSystemSettings);
router.get('/commissions', adminController.getCommissions);
router.get('/payouts', adminController.getAdminPayouts);
router.get('/email-templates', adminController.getEmailTemplates);
router.post('/email-templates', adminController.createEmailTemplate);

// ★ 追加: 予算別参考写真 (Budget Reference) の管理エンドポイント
router.get('/budget-references', adminController.getBudgetReferences);
router.post('/budget-references', adminController.upsertBudgetReference);
router.delete('/budget-references/:priceRange', adminController.deleteBudgetReference);

// --- 2. 動的IDパス (優先順位：中) ---
router.get('/projects/:projectId/chats', adminController.getProjectChatLogs);

router.patch('/projects/:id/status', (req, res) => { req.params.type = 'projects'; adminController.approveItem(req, res); });
router.patch('/florists/:id/status', (req, res) => { req.params.type = 'florists'; adminController.approveItem(req, res); });
router.patch('/illustrators/:id/status', (req, res) => { req.params.type = 'illustrators'; adminController.approveItem(req, res); });
router.patch('/venues/:id/status', (req, res) => { req.params.type = 'venues'; adminController.approveItem(req, res); });
router.patch('/organizers/:id/status', (req, res) => { req.params.type = 'organizers'; adminController.approveItem(req, res); });

router.get('/florists/:id/fee', adminController.getFloristFee);
router.patch('/florists/:id/fee', adminController.updateFloristFee);
router.get('/florists/:id', adminController.getFloristByIdAdmin);

// ★ 追加: イベントの編集と削除
router.patch('/events/:id', eventController.updateEvent);
router.delete('/events/:id', eventController.deleteEvent);

// --- 3. その他・汎用 (優先順位：低) ---
router.get('/pending/:type', adminController.getPendingItems);
router.post('/approve/:type/:id', adminController.approveItem);
router.patch('/settings', adminController.updateSystemSettings);
router.patch('/payouts/:id', adminController.updateAdminPayoutStatus);
router.post('/email-templates', adminController.createEmailTemplate);
router.get('/email-templates/:id', adminController.getEmailTemplate);
router.put('/email-templates/:id', adminController.updateEmailTemplate);
router.delete('/email-templates/:id', adminController.deleteEmailTemplate);
router.post('/send-email', adminController.sendIndividualEmail);
router.patch('/reports/:reportId/review', adminController.reviewReport);
router.post('/chat-rooms', adminController.createAdminChatRoom);
router.get('/chat-rooms/:roomId/messages', adminController.getAdminChatMessages);
router.get('/users/search', adminController.searchAllUsers);
router.patch('/projects/:projectId/visibility', adminController.updateProjectVisibility);

// ★★★ ここから追加: 強制削除用エンドポイント ★★★
router.delete('/users/:userId', adminController.deleteUserByAdmin);
router.delete('/projects/:projectId', adminController.deleteProjectByAdmin);
// ★★★ ここまで追加 ★★★

export default router;