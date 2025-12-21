import express from 'express';
import * as adminController from '../controllers/adminController.js';
import * as projectController from '../controllers/projectController.js'; // プロジェクトステータス更新用
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// すべてのエンドポイントに管理者認証を適用
router.use(requireAdmin);

// ==========================================
// ★★★ 1. プロジェクト管理 (Projects) ★★★
// ==========================================

// 審査待ち企画一覧 (元: /api/admin/projects/pending)
// ※ 汎用ルート(:type)より先に定義する必要があります
router.get('/projects/pending', (req, res) => {
    req.params.type = 'projects';
    adminController.getPendingItems(req, res);
});

// 全企画一覧 (元: /api/admin/projects)
router.get('/projects', adminController.getAllProjectsAdmin);

// 企画ステータス更新 (元: /api/admin/projects/:projectId/status)
// ※ projectControllerの更新ロジックを再利用しますが、Admin権限で実行されます
router.patch('/projects/:projectId/status', projectController.updateProjectStatus);

// 企画の公開/非公開 (元: /api/admin/projects/:projectId/visibility)
router.patch('/projects/:projectId/visibility', adminController.updateProjectVisibility);

// チャットログ閲覧 (元: /api/admin/projects/:projectId/chats)
router.get('/projects/:projectId/chats', adminController.getProjectChatLogs);


// ==========================================
// ★★★ 2. 審査・承認 (Generic Approval) ★★★
// ==========================================

// 花屋・会場・主催者の審査待ち (元: /api/admin/:role/pending)
// 例: /api/admin/florists/pending
router.get('/:type/pending', adminController.getPendingItems);

// 審査実行 (元: /api/admin/:role/:id/approval)
// 例: /api/admin/florists/123/approval
// ※ 元コードでは /status でしたが、adminController.approveItem は汎用的に作られています
// 元コードのパス /api/admin/florists/:floristId/status に合わせるなら以下を追加
router.patch('/florists/:id/status', (req, res) => { req.params.type = 'florists'; adminController.approveItem(req, res); });
router.patch('/venues/:id/status', (req, res) => { req.params.type = 'venues'; adminController.approveItem(req, res); });
router.patch('/organizers/:id/status', (req, res) => { req.params.type = 'organizers'; adminController.approveItem(req, res); });

// ==========================================
// ★★★ 3. その他管理機能 ★★★
// ==========================================

// 手数料一覧
router.get('/commissions', adminController.getCommissions);

// システム設定
router.get('/settings', adminController.getSystemSettings);
router.patch('/settings', adminController.updateSystemSettings);

// 花屋個別手数料
router.get('/florists/:floristId/fee', adminController.getFloristFee);
router.patch('/florists/:floristId/fee', adminController.updateFloristFee);

// 出金管理
router.get('/payouts', adminController.getAdminPayouts); // ?type=user|florist
router.patch('/payouts/:id', adminController.updateAdminPayoutStatus); // 元: /api/admin/payouts/:id/complete 等

// 通報関連
router.get('/reports', (req, res) => { req.params.type = 'events'; adminController.getReports(req, res); }); // デフォルト
router.get('/event-reports', (req, res) => { req.params.type = 'events'; adminController.getReports(req, res); });
router.get('/chat-reports', (req, res) => { req.params.type = 'chat'; adminController.getReports(req, res); });

router.patch('/reports/:reportId/review', adminController.reviewReport);
router.patch('/event-reports/:reportId/dismiss', adminController.dismissEventReport);

// メール・チャットサポート
router.get('/email-templates', adminController.getEmailTemplates);
router.post('/email-templates', adminController.saveEmailTemplate);
router.post('/send-individual-email', adminController.sendIndividualEmail);
router.get('/users/search', adminController.searchAllUsers);
router.post('/chat-rooms', adminController.createAdminChatRoom);
router.get('/chat-rooms/:roomId/messages', adminController.getAdminChatMessages);

// イベント・会場BAN/削除
router.patch('/events/:eventId/ban', adminController.banEvent);
router.post('/venues', adminController.createVenueAdmin);
router.patch('/venues/:id', adminController.updateVenueAdmin);
router.delete('/venues/:id', adminController.deleteVenueAdmin);

export default router;