import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service.js';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../config/constants.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { createResponse } from '../utils/helpers.js';
import { UpdateUserDto } from '../types/user.types.js';
import logger from '../utils/logger.js';

const userService = new UserService();

/**
 * Get current user profile
 * GET /api/users/me
 */
export const getMyProfile = asyncHandler(async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userId = req.user!.id;

  const profile = await userService.getUserProfile(userId);

  res.status(HTTP_STATUS.OK).json(
    createResponse(
      true,
      { user: profile },
      'Profile retrieved successfully',
      HTTP_STATUS.OK
    )
  );
});

/**
 * Update user profile
 * PATCH /api/users/update
 */
export const updateProfile = asyncHandler(async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userId = req.user!.id;
  const updateData: UpdateUserDto = req.body;

  const updatedProfile = await userService.updateUserProfile(userId, updateData);

  logger.info('User profile updated', { userId, updatedFields: Object.keys(updateData) });

  res.status(HTTP_STATUS.OK).json(
    createResponse(
      true,
      { user: updatedProfile },
      SUCCESS_MESSAGES.PROFILE_UPDATED,
      HTTP_STATUS.OK
    )
  );
});

/**
 * Change password
 * POST /api/users/change-password
 */
export const changePassword = asyncHandler(async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userId = req.user!.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new Error('currentPassword and newPassword are required');
  }

  const result = await userService.changePassword(userId, currentPassword, newPassword);

  logger.info('User password changed', { userId });

  res.status(HTTP_STATUS.OK).json(
    createResponse(
      true,
      result,
      SUCCESS_MESSAGES.PASSWORD_CHANGED,
      HTTP_STATUS.OK
    )
  );
});

