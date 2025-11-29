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
    getAllVenues,
    verifyVenue,
    suspendVenue,
    reactivateVenue
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

// ==================== VENUE MANAGEMENT ====================
router.get('/venues', getAllVenues);
router.patch('/venues/:venueId/verify', verifyVenue);
router.patch('/venues/:venueId/suspend', suspendVenue);
router.patch('/venues/:venueId/reactivate', reactivateVenue);

export default router;

