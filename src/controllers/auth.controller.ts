import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { EmailService } from '../services/email.service.js';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../config/constants.js';
import { createResponse } from '../utils/helpers.js';
import { CreateUserDto, LoginDto } from '../types/user.types.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import logger from '../utils/logger.js';

const authService = new AuthService();
const emailService = new EmailService();

// Register a new user
export const register = asyncHandler(async (
    req: Request, 
    res: Response, 
    next: NextFunction
): Promise<void> => {
    const userData: CreateUserDto = req.body;
    const result = await authService.register(userData);

    // Send welcome email (fire and forget)
    emailService.sendWelcomeEmail(result.user.email, result.user.fullName)
        .then(() => {
            logger.info('Welcome email sent successfully', { email: result.user.email });
        })
        .catch((error) => {
            logger.error('Failed to send welcome email', { 
                email: result.user.email, 
                error: error.message 
            });
        });

    res.status(HTTP_STATUS.CREATED).json(
        createResponse(
            true, 
            result, 
            SUCCESS_MESSAGES.USER_REGISTERED,
            HTTP_STATUS.CREATED
        )
    );
});

// Login user
export const login = asyncHandler(async (
    req: Request, 
    res: Response, 
    next: NextFunction
): Promise<void> => {
    const credentials: LoginDto = req.body;
    const result = await authService.login(credentials);

    res.status(HTTP_STATUS.OK).json(
        createResponse(
            true, 
            result, 
            SUCCESS_MESSAGES.USER_LOGGED_IN,
            HTTP_STATUS.OK
        )
    );
});

// Logout user
export const logout = asyncHandler(async (
    req: Request, 
    res: Response, 
    next: NextFunction
): Promise<void> => {
    await authService.logout(req.user!.id);
    
    res.status(HTTP_STATUS.OK).json(
        createResponse(
            true, 
            null, 
            SUCCESS_MESSAGES.USER_LOGGED_OUT,
            HTTP_STATUS.OK
        )
    );
});

// Refresh access tokens
export const refreshToken = asyncHandler(async (
    req: Request, 
    res: Response, 
    next: NextFunction
): Promise<void> => {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshToken(refreshToken);

    res.status(HTTP_STATUS.OK).json(
        createResponse(
            true, 
            tokens, 
            'Tokens refreshed successfully',
            HTTP_STATUS.OK
        )
    );
});