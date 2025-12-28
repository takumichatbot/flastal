import express from 'express';
import * as adminController from '../controllers/adminController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * 全ての管理ルートに認証とAdmin権限を強制
 * ※ app.js で /api/admin にマウントされているため、
 * ここでの '/' は実質 '/api/admin/' となります。
 */
router.use(authenticateToken);
router.use(requireAdmin);

// --- 審査・承認ルート ---
// 形式A: /api/admin/pending/:type
router.get('/pending/:type', adminController.getPendingItems);

// 形式B: /api/admin/:type/pending (フロントエンドの現在の挙動に合わせる)
router.get('/projects/pending', (req, res) => { req.params.type = 'projects'; adminController.getPendingItems(req, res); });
router.get('/florists/pending', (req, res) => { req.params.type = 'florists'; adminController.getPendingItems(req, res); });
router.get('/venues/pending', (req, res) => { req.params.type = 'venues'; adminController.getPendingItems(req, res); });
router.get('/organizers/pending', (req, res) => { req.params.type = 'organizers'; adminController.getPendingItems(req, res); });

// 承認実行
router.post('/approve/:type/:id', adminController.approveItem);

// --- システム設定 ---
router.get('/settings', adminController.getSystemSettings);
router.patch('/settings', adminController.updateSystemSettings);

// --- 手数料・売上 ---
router.get('/commissions', adminController.getCommissions);
router.get('/florists/:floristId/fee', adminController.getFloristFee);
router.patch('/florists/:floristId/fee', adminController.updateFloristFee);

// --- 出金管理 ---
router.get('/payouts', adminController.getAdminPayouts);
router.patch('/payouts/:id', adminController.updateAdminPayoutStatus);

// --- メール・テンプレート ---
router.get('/email-templates', adminController.getEmailTemplates);
router.post('/email-templates', adminController.saveEmailTemplate);
router.post('/send-email', adminController.sendIndividualEmail);

// --- 通報管理 ---
router.get('/reports/:type', adminController.getReports);
router.get('/chat-reports', (req, res) => { req.params.type = 'chat'; adminController.getReports(req, res); });
router.get('/event-reports', (req, res) => { req.params.type = 'events'; adminController.getReports(req, res); });
router.patch('/reports/:reportId/review', adminController.reviewReport);

// --- チャット・ログ ---
router.post('/chat-rooms', adminController.createAdminChatRoom);
router.get('/chat-rooms/:roomId/messages', adminController.getAdminChatMessages);
router.get('/projects/:projectId/chat-logs', adminController.getProjectChatLogs);

// --- ユーザー・企画検索 ---
router.get('/users/search', adminController.searchAllUsers);
router.get('/projects/all', adminController.getAllProjectsAdmin);
router.patch('/projects/:projectId/visibility', adminController.updateProjectVisibility);

// --- 会場・イベント管理 ---
router.post('/venues', adminController.createVenueAdmin);
router.patch('/venues/:id', adminController.updateVenueAdmin);
router.delete('/venues/:id', adminController.deleteVenueAdmin);
router.patch('/events/:eventId/ban', adminController.banEvent);
router.delete('/event-reports/:reportId', adminController.dismissEventReport);

export default router;