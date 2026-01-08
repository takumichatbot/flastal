import express from 'express';
import * as venueController from '../controllers/venueController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// --- 1. 会場関連ルート ---
router.get('/admin', authenticateToken, venueController.getVenues);
router.get('/', venueController.getVenues);
router.get('/:id', venueController.getVenueById);
router.post('/', authenticateToken, venueController.addVenueByUser);
router.patch('/:id', authenticateToken, venueController.updateVenueProfile);
router.delete('/:id', authenticateToken, venueController.deleteVenue);
router.get('/:venueId/logistics', venueController.getLogisticsInfo);
router.post('/:venueId/logistics', authenticateToken, venueController.postLogisticsInfo);

// --- 2. イベント関連ルート (フロントエンドの期待に合わせる) ---
router.get('/public', venueController.getEvents); // /api/events/public
router.get('/list', venueController.getEvents);   // /api/events/list
router.post('/user-submit', authenticateToken, venueController.createEvent); // /api/events/user-submit ★追加
router.post('/', authenticateToken, venueController.createEvent); // /api/events/
router.get('/:id', venueController.getEventById);
router.patch('/:id', authenticateToken, venueController.updateEvent);
router.delete('/:id', authenticateToken, venueController.deleteEvent);

export default router;