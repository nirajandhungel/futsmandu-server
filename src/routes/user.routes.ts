import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateRequest, validationSchemas } from '../middleware/validation.middleware.js';
import {
  getMyProfile,
  updateProfile,
  changePassword
} from '../controllers/user.controller.js';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// Get current user profile
router.get('/me', getMyProfile);

// Update user profile
router.patch(
  '/update',
  // validateRequest(validationSchemas.updateUser || {}), // Add validation schema later
  updateProfile
);

// Change password
router.post(
  '/change-password',
  // validateRequest(validationSchemas.changePassword || {}), // Add validation schema later
  changePassword
);



export default router;

