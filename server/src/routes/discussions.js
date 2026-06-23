import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import * as ctrl from '../controllers/discussionController.js';

const router = express.Router({ mergeParams: true });

router.get('/',    ctrl.getDiscussions);
router.post('/',   authenticateToken, ctrl.createDiscussion);
router.get('/:discussionId/replies', ctrl.getDiscussionReplies);
router.delete('/:id', authenticateToken, ctrl.deleteDiscussion);

export default router;
