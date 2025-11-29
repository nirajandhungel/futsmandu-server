import { Router } from "express";
import { courtController } from "../controllers/court.controller.js";
import {authenticate, authorize} from '../middleware/auth.middleware.js';
import { UserMode, UserRole } from "../types/common.types.js";
import { requireMode } from "../middleware/mode.middleware.js";
const router = Router();

// ==================== PUBLIC ROUTES ====================

// Search operations
router.get('/public/venues/search', courtController.searchVenues);
router.get('/public/courts/search', courtController.searchCourts);

// Get operations
router.get('/public/venues', courtController.getAllVenues);
router.get('/public/venues/:venueId', courtController.getVenueById);
router.get('/public/venues/:venueId/courts', courtController.getVenueWithCourts);
router.get('/public/courts/:courtId', courtController.getCourtById);
router.get('/public/courts/:courtId/availability', courtController.getCourtAvailability);

// ==================== OWNER ROUTES ====================

router.post('/venues/:venueId/courts', 
  authenticate, 
  authorize(UserRole.OWNER), 
  requireMode([UserMode.OWNER]),
  courtController.addCourtToVenue
);

router.get('/owner/my-venues', 
  authenticate, 
  authorize(UserRole.OWNER), 
  requireMode([UserMode.OWNER]),
  courtController.getOwnerVenues
);

router.put('/courts/:courtId', 
  authenticate, 
  authorize(UserRole.OWNER), 
  requireMode([UserMode.OWNER]),
  courtController.updateCourt
);

router.delete('/courts/:courtId', 
  authenticate, 
  authorize(UserRole.OWNER), 
  requireMode([UserMode.OWNER]),
  courtController.deleteCourt
);

// ==================== ADMIN ROUTES ====================

router.get('/admin/venues', 
  authenticate, 
  authorize(UserRole.ADMIN), 
  courtController.getAllVenues
);

router.patch('/admin/venues/:venueId/verify', 
  authenticate, 
  authorize(UserRole.ADMIN), 
  courtController.verifyVenue
);

router.patch('/admin/venues/:venueId/suspend', 
  authenticate, 
  authorize(UserRole.ADMIN), 
  courtController.suspendVenue
);

router.patch('/admin/venues/:venueId/activate', 
  authenticate, 
  authorize(UserRole.ADMIN), 
  courtController.activateVenue
);

export default router;

