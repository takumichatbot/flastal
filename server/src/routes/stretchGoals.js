import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import * as ctrl from '../controllers/stretchGoalController.js';

const router = Router({ mergeParams: true });

router.get('/',        ctrl.getStretchGoals);
router.post('/',       authenticateToken, ctrl.createStretchGoal);
router.delete('/:id',  authenticateToken, ctrl.deleteStretchGoal);

export default router;
