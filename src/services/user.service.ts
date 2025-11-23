import { UserRepository } from '../repositories/user.repository.js';
import { UpdateUserDto } from '../types/user.types.js';
import { NotFoundError, ValidationError } from '../middleware/error.middleware.js';
import { ERROR_CODES, ERROR_MESSAGES } from '../config/constants.js';
import logger from '../utils/logger.js';

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError(
        ERROR_MESSAGES[ERROR_CODES.USER_NOT_FOUND],
        ERROR_CODES.USER_NOT_FOUND,
        { userId }
      );
    }

    // Return public user data (similar to AuthService.toPublicUser)
    const rawOwnerProfile = user.ownerProfile
      ? typeof (user.ownerProfile as any).toObject === 'function'
        ? (user.ownerProfile as any).toObject()
        : user.ownerProfile
      : undefined;

    const ownerProfile = rawOwnerProfile
      ? {
          ...rawOwnerProfile,
          additionalKyc: rawOwnerProfile.additionalKyc instanceof Map
            ? Object.fromEntries(rawOwnerProfile.additionalKyc)
            : rawOwnerProfile.additionalKyc,
        }
      : undefined;

    return {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      mode: user.mode,
      ownerStatus: user.ownerProfile?.status,
      ownerProfile,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      profileImage: user.profileImage,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updateData: UpdateUserDto) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError(
        ERROR_MESSAGES[ERROR_CODES.USER_NOT_FOUND],
        ERROR_CODES.USER_NOT_FOUND,
        { userId }
      );
    }

    const updatedUser = await this.userRepository.updateById(userId, updateData as any);
    if (!updatedUser) {
      throw new NotFoundError(
        ERROR_MESSAGES[ERROR_CODES.USER_UPDATE_FAILED],
        ERROR_CODES.USER_UPDATE_FAILED
      );
    }

    logger.info('User profile updated', { userId, updatedFields: Object.keys(updateData) });

    return this.getUserProfile(userId);
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError(
        ERROR_MESSAGES[ERROR_CODES.USER_NOT_FOUND],
        ERROR_CODES.USER_NOT_FOUND,
        { userId }
      );
    }

    // Get user with password
    const userWithPassword = await this.userRepository.findByEmailWithPassword(user.email);
    if (!userWithPassword) {
      throw new NotFoundError(
        ERROR_MESSAGES[ERROR_CODES.USER_NOT_FOUND],
        ERROR_CODES.USER_NOT_FOUND
      );
    }

    // Verify current password
    const isPasswordValid = await userWithPassword.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new ValidationError(
        'Current password is incorrect',
        { field: 'currentPassword' }
      );
    }

    // Validate new password
    if (newPassword.length < 8) {
      throw new ValidationError(
        ERROR_MESSAGES[ERROR_CODES.VALIDATION_PASSWORD_WEAK],
        { field: 'newPassword' }
      );
    }

    // Update password
    await this.userRepository.updatePassword(userId, newPassword);

    logger.info('User password changed', { userId });

    return { message: 'Password changed successfully' };
  }
}

