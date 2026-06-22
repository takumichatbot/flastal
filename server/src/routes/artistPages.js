import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import * as ctrl from '../controllers/artistPageController.js';

const router = Router();

router.get('/',            ctrl.listArtistPages);
router.get('/:slug',       ctrl.getArtistPage);
router.get('/:slug/projects', ctrl.getArtistProjects);
router.put('/:slug',       authenticateToken, ctrl.upsertArtistPage);

export default router;
