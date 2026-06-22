import { Router } from 'express';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import * as teamCtrl from '../controllers/teamController.js';
import * as exclusiveCtrl from '../controllers/exclusiveContentController.js';

const router = Router({ mergeParams: true });

// ④ 達成メッセージ一斉送信
router.post('/broadcast',     authenticateToken, teamCtrl.broadcastSuccessMessage);

// ⑤ チームメンバー
router.get('/members',        teamCtrl.getTeamMembers);
router.post('/members',       authenticateToken, teamCtrl.inviteTeamMember);
router.delete('/members/:memberId', authenticateToken, teamCtrl.removeTeamMember);

// ③ 支援者限定コンテンツ
router.get('/exclusive',      optionalAuth, exclusiveCtrl.getExclusiveContents);
router.post('/exclusive',     authenticateToken, exclusiveCtrl.createExclusiveContent);
router.delete('/exclusive/:id', authenticateToken, exclusiveCtrl.deleteExclusiveContent);

export default router;
