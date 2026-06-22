import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import * as ctrl from '../controllers/giftCardController.js';

const router = Router();

router.post('/',         authenticateToken, ctrl.issueGiftCard);
router.post('/redeem',   authenticateToken, ctrl.redeemGiftCard);
router.get('/mine',      authenticateToken, ctrl.getMyGiftCards);
router.get('/:code',     ctrl.getGiftCardInfo);

export default router;
