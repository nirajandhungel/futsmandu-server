import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { ownerDocumentsUpload, futsalCourtImagesUpload, venueCreationUpload } from '../middleware/upload.middleware.js';
import { validateRequest, validationSchemas } from '../middleware/validation.middleware.js';
import {
  activateOwnerMode,
  deactivateOwnerMode,
  getOwnerProfile,
  createVenue,
  getDashboard,
  approveBooking,
  completeBooking,
  rejectBooking,
  usePlayerMode,
  useOwnerMode
} from '../controllers/owner.controller.js';
import { requireMode } from '../middleware/mode.middleware.js';
import { UserMode, UserRole } from '../types/common.types.js';

const router = Router();

// ==================== OWNER ACTIVATION (No auth required for activation) ====================
router.post(
  '/activate',
  authenticate,
  requireMode([UserMode.PLAYER]),
  ownerDocumentsUpload,
  // validateRequest(validationSchemas.ownerActivate),
  activateOwnerMode
);

// ==================== OWNER ROUTES (Require authentication and owner role) ====================
// Apply authentication and authorization to all routes below
router.use(authenticate);
router.use(authorize(UserRole.OWNER));

// Get owner profile
router.get('/profile', getOwnerProfile);

// Create venue with courts (at least one 5v5 or 6v6 court required)
// Uses FormData with simplified court structure
router.post(
  '/venues',
  requireMode([UserMode.OWNER]),
  venueCreationUpload, // Handle venue and court image uploads
  validateRequest(validationSchemas.createFutsalCourt),
  createVenue
);

// Get dashboard analytics
router.get(
  '/dashboard',
  requireMode([UserMode.OWNER]),
  getDashboard
);

// Deactivate owner mode
router.post(
  '/deactivate',
  requireMode([UserMode.OWNER]),
  validateRequest(validationSchemas.ownerDeactivate),
  deactivateOwnerMode
);
// Player owner mode
router.post(
  '/player-mode',
  requireMode([UserMode.OWNER]),
  // validateRequest(validationSchemas.playerMode),
  usePlayerMode
);
router.post(
  '/owner-mode',
  requireMode([UserMode.OWNER]),
  // validateRequest(validationSchemas.ownerMode),
  useOwnerMode
);

// ==================== BOOKING MANAGEMENT ====================
router.patch(
  '/bookings/:id/approve',
  requireMode([UserMode.OWNER]),
  approveBooking
);
router.patch(
  '/bookings/:id/complete',
  requireMode([UserMode.OWNER]),
  completeBooking
);

router.patch(
  '/bookings/:id/reject',
  requireMode([UserMode.OWNER]),
  rejectBooking
);

export default router;

