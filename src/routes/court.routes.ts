import { Router } from "express";
import { courtController, CourtController } from "../controllers/court.controller.js";
import {authenticate, authorize} from '../middleware/auth.middleware.js';
import { UserMode, UserRole } from "../types/common.types.js";
import { requireMode } from "../middleware/mode.middleware.js";
const router = Router();

// public routes

//search operations

router.get('/public/futsal-courts/search',courtController.searchFutsalCourts);
router.get('/public/courts/search',courtController.searchCourts);

//get opeartions
router.get('/public/futsal-courts/:futsalCourtId',courtController.getFutsalCourtById);
router.get('/public/futsal-courts/:futsalCourtId/courts',courtController.getFutsalCourtWithCourts);
router.get('/public/courts/:courtId',courtController.getCourtById)
router.get('/public/courts/courtId/availability',courtController.getCourtAvailability);

//owner routes

// ==================== OWNER ROUTES ====================

router.post('/futsal-courts/:futsalCourtId/courts', 
  authenticate, 
  authorize(UserRole.OWNER), 
  requireMode([UserMode.OWNER]),
  courtController.createCourt
);

router.get('/owner/my-courts', 
  authenticate, 
  authorize(UserRole.OWNER), 
  requireMode([UserMode.OWNER]),
  courtController.getOwnerCourts
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

router.get('/admin/futsal-courts', 
  authenticate, 
  authorize(UserRole.ADMIN), 
  courtController.getAllFutsalCourts
);

router.patch('/admin/futsal-courts/:futsalCourtId/verify', 
  authenticate, 
  authorize(UserRole.ADMIN), 
  courtController.verifyFutsalCourt
);

router.patch('/admin/futsal-courts/:futsalCourtId/suspend', 
  authenticate, 
  authorize(UserRole.ADMIN), 
  courtController.suspendFutsalCourt
);

router.patch('/admin/futsal-courts/:futsalCourtId/activate', 
  authenticate, 
  authorize(UserRole.ADMIN), 
  courtController.activateFutsalCourt
);

export default router;

