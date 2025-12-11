import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateRequest, validationSchemas } from '../middleware/validation.middleware.js';
import {
  createBooking,
  joinBooking,
  leaveBooking,
  invitePlayers,
  getMyBookings,
  getBookingById,
  getJoinableBookings
} from '../controllers/booking.controller.js';
import { cancelBooking, rejectBooking } from '../controllers/owner.controller.js';
import { requireMode } from '../middleware/mode.middleware.js';
import { UserMode } from '../types/common.types.js';

const router = Router();

// ==================== PUBLIC ROUTES ====================
// Get joinable bookings (for solo players looking to join groups)
router.get('/joinable', getJoinableBookings);

// ==================== AUTHENTICATED ROUTES ====================
// All booking routes below require authentication
router.use(authenticate);

// Create a new booking
router.post(
  '/',
  validateRequest(validationSchemas.createBooking || {}), // Add validation schema later
  createBooking
);

// Get user's bookings
router.get('/my', getMyBookings);

// Join a booking
router.post('/:id/join', joinBooking);

// Leave a booking
router.post('/:id/leave', leaveBooking);

// Invite players to booking
router.post('/:id/invite', invitePlayers);

// Get booking by ID
router.get('/:id', getBookingById);

router.patch(
  '/:id/cancel',
  requireMode([UserMode.PLAYER]),
  cancelBooking
);

export default router;

