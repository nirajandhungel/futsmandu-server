import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validateRequest, validationSchemas } from '../middleware/validation.middleware.js';
import { UserRole } from '../types/common.types.js';
import {
    getDashboardStats,
    getPendingOwnerRequests,
    approveOwnerRequest,
    updateOwnerStatus,
    getAllUsers,
    getUserById,
    updateUserStatus,
    deleteUser,
    getAllFutsalCourts,
    verifyFutsalCourt,
    suspendFutsalCourt,
    reactivateFutsalCourt
} from '../controllers/admin.controller.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

// ==================== DASHBOARD ====================
router.get('/dashboard/stats', getDashboardStats);

// ==================== OWNER MANAGEMENT ====================
router.get('/owners/pending', getPendingOwnerRequests);
router.patch('/owners/:ownerId/approve', validateRequest(validationSchemas.approveOwnerRequest), approveOwnerRequest);
router.patch('/owners/:ownerId/status', validateRequest(validationSchemas.updateOwnerStatus), updateOwnerStatus);

// ==================== USER MANAGEMENT ====================
router.get('/users', getAllUsers);
router.get('/users/:userId', getUserById);
router.patch('/users/:userId/status', validateRequest(validationSchemas.updateUserStatus), updateUserStatus);
router.delete('/users/:userId', deleteUser);

// ==================== FUTSAL COURT MANAGEMENT ====================
router.get('/futsal-courts', getAllFutsalCourts);
router.patch('/futsal-courts/:futsalCourtId/verify', verifyFutsalCourt);
router.patch('/futsal-courts/:futsalCourtId/suspend', suspendFutsalCourt);
router.patch('/futsal-courts/:futsalCourtId/reactivate', reactivateFutsalCourt);

export default router;

