import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import * as ctrl from '../controllers/galleryController.js';

const router = Router({ mergeParams: true });

router.get('/feed',         ctrl.getGalleryFeed);
router.get('/:projectId',   ctrl.getProjectPhotos);
router.post('/:projectId',  authenticateToken, ctrl.postPhoto);
router.delete('/:id',       authenticateToken, ctrl.deletePhoto);

export default router;
