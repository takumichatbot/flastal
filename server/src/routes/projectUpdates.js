import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import * as ctrl from '../controllers/projectUpdateController.js';

const router = Router({ mergeParams: true });

router.get('/',    ctrl.getUpdates);
router.post('/',   authenticateToken, ctrl.createUpdate);
router.delete('/:id', authenticateToken, ctrl.deleteUpdate);

export default router;
