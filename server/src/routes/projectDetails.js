import express from 'express';
import * as actionController from '../controllers/projectActionController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 活動報告
router.post('/announcements', authenticateToken, actionController.createAnnouncement);

// 収支
router.post('/expenses', authenticateToken, actionController.addExpense);
router.delete('/expenses/:expenseId', authenticateToken, actionController.deleteExpense);

// タスク
router.post('/tasks', authenticateToken, actionController.addTask);
router.patch('/tasks/:taskId', authenticateToken, actionController.updateTask);
router.delete('/tasks/:taskId', authenticateToken, actionController.deleteTask);

// メッセージカード
router.post('/messages', authenticateToken, actionController.postMessage);

// グループチャット機能
router.get('/chat-templates', actionController.getChatTemplates);
router.post('/group-chat/polls', authenticateToken, actionController.createPoll);
router.post('/group-chat/polls/vote', authenticateToken, actionController.votePoll);
router.post('/group-chat/reactions', authenticateToken, actionController.toggleReaction);
router.post('/group-chat/:projectId/summarize', authenticateToken, actionController.summarizeChat);
router.post('/group-chat/:messageId/report', authenticateToken, (req, res, next) => { req.body.type = 'GROUP'; next(); }, actionController.reportChat);
router.post('/chat/:messageId/report', authenticateToken, (req, res, next) => { req.body.type = 'DIRECT'; next(); }, actionController.reportChat);

// レビュー
router.post('/reviews', authenticateToken, actionController.createReview);
router.get('/reviews/featured', actionController.getFeaturedReviews);
router.post('/reviews/:reviewId/like', actionController.toggleReviewLike);

// チャットルーム情報 (個別チャット用)
router.get('/chat/:roomId', actionController.getChatRoomInfo);

// 企画通報
router.post('/reports/project', actionController.reportProject); // ※URLは /api/reports/project になるように app.js で調整が必要かも

// ギャラリー
router.get('/gallery/feed', actionController.getGalleryFeed);

// ムードボード
router.post('/projects/:id/moodboard', authenticateToken, actionController.addToMoodBoard);
router.get('/projects/:id/moodboard', actionController.getMoodBoard);
router.patch('/moodboard/:itemId/like', authenticateToken, actionController.likeMoodBoardItem);
router.delete('/moodboard/:itemId', authenticateToken, actionController.deleteMoodBoardItem);

// 推しリアクション
router.post('/projects/:id/official-react', actionController.officialReact);
router.get('/projects/:id/official-status', actionController.getOfficialStatus);

// デジタルフラスタ
router.post('/projects/:id/digital-flowers', actionController.sendDigitalFlower);
router.get('/projects/:id/digital-flowers', actionController.getDigitalFlowers);
export default router;