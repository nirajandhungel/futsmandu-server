import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  getPublicGroupMatches,
  joinGroupMatch
} from '../controllers/booking.controller.js';

const router = Router();

// Group matchmaking routes
// Viewing public groups doesn't require auth, but joining does
router.get('/groups', getPublicGroupMatches);
router.post('/groups/:id/join', authenticate, joinGroupMatch);

export default router;

