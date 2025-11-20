import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { ownerDocumentsUpload } from '../middleware/upload.middleware.js';
import { validateRequest, validationSchemas } from '../middleware/validation.middleware.js';
import { activateOwnerMode, deactivateOwnerMode, getOwnerProfile } from '../controllers/owner.controller.js';
import { requireMode } from '../middleware/mode.middleware.js';
import { UserMode, UserRole } from '../types/common.types.js';

const router = Router();

router.post(
  '/activate',
  authenticate,
  requireMode([UserMode.PLAYER]),
  ownerDocumentsUpload,
  validateRequest(validationSchemas.ownerActivate),
  activateOwnerMode
);

router.post(
  '/deactivate',
  authenticate,
  authorize(UserRole.OWNER),
  requireMode([UserMode.OWNER]),
  validateRequest(validationSchemas.ownerDeactivate),
  deactivateOwnerMode
);

router.get(
  '/profile',
  authenticate,
  authorize(UserRole.OWNER),
  getOwnerProfile
);

export default router;

