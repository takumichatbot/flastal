import express from 'express';
import * as postController from '../controllers/postController.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', optionalAuth, postController.getPublicFeed);
router.get('/my', authenticateToken, postController.getMyPosts);
router.post('/', authenticateToken, postController.createPost);
router.post('/:id/like', authenticateToken, postController.toggleLike);
router.get('/:id/comments', postController.getComments);
router.post('/:id/comments', authenticateToken, postController.addComment);
router.delete('/:id', authenticateToken, postController.deletePost);

export default router;
