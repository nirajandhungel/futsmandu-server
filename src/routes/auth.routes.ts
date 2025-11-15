import {Router } from 'express';

import * as authController from '../controllers/auth.controller.js';
import {authenticate} from '../middleware/auth.middleware.js';
import { validateRequest, validationSchemas } from '../middleware/validation.middleware.js';

import {authLimiter} from '../middleware/rateLimit.middleware.js';  

const router = Router();

// User Registration
router.post(
    '/register',
    // authLimiter,
    validateRequest(validationSchemas.register),
    authController.register
);

// User Login
router.post(
    '/login',
    authLimiter,
    validateRequest(validationSchemas.login),
    authController.login
);

// logout user
router.post(
    '/logout',
    authenticate,
    authController.logout
);

// rfresh token
router.post(
    '/refresh-token',
    authLimiter,
    validateRequest(validationSchemas.refreshToken),
    authController.refreshToken
);

export default router;