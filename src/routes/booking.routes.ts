import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateRequest, validationSchemas } from '../middleware/validation.middleware.js';
import {
  createBooking,
  joinBooking,
  leaveBooking,
  invitePlayers,
  getMyBookings,
  getBookingById
} from '../controllers/booking.controller.js';

const router = Router();

// All booking routes require authentication
router.use(authenticate);

// Create booking
router.post(
  '/',
  validateRequest(validationSchemas.createBooking || {}), // Add validation schema later
  createBooking
);

// Get user's bookings
router.get('/my', getMyBookings);

// Get booking by ID
router.get('/:id', getBookingById);

// Join a booking
router.post('/:id/join', joinBooking);

// Leave a booking
router.post('/:id/leave', leaveBooking);

// Invite players to booking
router.post('/:id/invite', invitePlayers);

export default router;

