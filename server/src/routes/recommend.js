import express from 'express';
import { optionalAuth } from '../middleware/auth.js';
import { getRecommendedProjects } from '../controllers/recommendController.js';

const router = express.Router();

router.get('/', optionalAuth, getRecommendedProjects);

export default router;
