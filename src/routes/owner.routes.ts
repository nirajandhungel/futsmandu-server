import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { ownerDocumentsUpload, futsalCourtImagesUpload } from '../middleware/upload.middleware.js';
import { validateRequest, validationSchemas } from '../middleware/validation.middleware.js';
import { 
  activateOwnerMode, 
  deactivateOwnerMode, 
  getOwnerProfile,
  createFutsalCourt,
  getDashboard,
  approveBooking,
  rejectBooking
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
  validateRequest(validationSchemas.ownerActivate),
  activateOwnerMode
);

// ==================== OWNER ROUTES (Require authentication and owner role) ====================
// Apply authentication and authorization to all routes below
router.use(authenticate);
router.use(authorize(UserRole.OWNER));

// Get owner profile
router.get('/profile', getOwnerProfile);

// Create futsal court (venue)
router.post(
  '/courts',
  requireMode([UserMode.OWNER]),
  futsalCourtImagesUpload, // Handle image uploads
  validateRequest(validationSchemas.createFutsalCourt),
  createFutsalCourt
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

// ==================== BOOKING MANAGEMENT ====================
router.patch(
  '/bookings/:id/approve',
  requireMode([UserMode.OWNER]),
  approveBooking
);

router.patch(
  '/bookings/:id/reject',
  requireMode([UserMode.OWNER]),
  rejectBooking
);

export default router;

