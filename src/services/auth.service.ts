import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/user.repository.js';
import { CreateUserDto, LoginDto, AuthTokens, JwtPayload } from '../types/user.types.js';
import { config } from '../config/environment.js';
import { ERROR_CODES, ERROR_MESSAGES } from '../config/constants.js';
import { 
    AuthenticationError, 
    ConflictError,
    AppError,
    ServiceUnavailableError
} from '../middleware/error.middleware.js';
import logger from '../utils/logger.js';
import type { IUser } from '../models/user.model.js';
import { UserMode, UserRole } from '../types/common.types.js';

export class AuthService {
    private userRepository: UserRepository;

    constructor() {
        this.userRepository = new UserRepository();
    }

    /**
     * Register a new user
     * @throws {ConflictError} If user already exists
     * @throws {ValidationError} If user data is invalid
     * @throws {AppError} For other registration failures
     */
    async register(userData: CreateUserDto): Promise<{ user: any; tokens: AuthTokens }> {
        try {
            // Check if user already exists
            const existingUser = await this.userRepository.findByEmail(userData.email);
            
            if (existingUser) {
                throw new ConflictError(
                    ERROR_MESSAGES[ERROR_CODES.USER_ALREADY_EXISTS],
                    ERROR_CODES.USER_ALREADY_EXISTS,
                    {
                        email: userData.email,
                        suggestion: 'Please log in or use a different email address'
                    }
                );
            }

            // Create new user
            const payload = {
                ...userData,
                role: userData.role ?? UserRole.PLAYER,
            };
            const newUser = await this.userRepository.create(payload);
            
            // Generate authentication tokens
            const tokens = this.generateUserTokens(newUser);

            // Save refresh token to database
            await this.userRepository.updateRefreshToken(
                newUser._id.toString(), 
                tokens.refreshToken
            );
            
            logger.info('User registered successfully', { 
                userId: newUser._id, 
                email: newUser.email,
                role: newUser.role 
            });

            // Return sanitized user data with tokens
            return {
                user: this.toPublicUser(newUser),
                tokens
            };

        } catch (error) {
            // Log registration failure
            logger.error('User registration failed', { 
                email: userData.email, 
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            
            // Re-throw known errors
            if (error instanceof AppError) {
                throw error;
            }
            
            // Wrap unknown errors
            throw new AppError(
                ERROR_MESSAGES[ERROR_CODES.USER_CREATION_FAILED],
                500
            );
        }
    }

    /**
     * Authenticate user and generate tokens
     * @throws {AuthenticationError} If credentials are invalid or account is inactive
     */
    async login(credentials: LoginDto): Promise<{ user: any; tokens: AuthTokens }> {
        try {
            // Find user with password field included
            const user = await this.userRepository.findByEmailWithPassword(credentials.email);
            
            // Check if user exists
            if (!user) {
                throw new AuthenticationError(
                    ERROR_MESSAGES[ERROR_CODES.AUTH_INVALID_CREDENTIALS],
                    ERROR_CODES.AUTH_INVALID_CREDENTIALS,
                    { 
                        suggestion: 'Please check your credentials or reset your password'
                    }
                );
            }

            // Check if account is active
            if (!user.isActive) {
                throw new AuthenticationError(
                    ERROR_MESSAGES[ERROR_CODES.AUTH_ACCOUNT_INACTIVE],
                    ERROR_CODES.AUTH_ACCOUNT_INACTIVE,
                    {
                        userId: user._id.toString(),
                        suggestion: 'Please contact support to reactivate your account'
                    }
                );
            }

            // Validate password
            const isPasswordValid = await user.comparePassword(credentials.password);
            
            if (!isPasswordValid) {
                // Log failed attempt for security monitoring
                logger.warn('Failed login attempt', { 
                    email: credentials.email,
                    userId: user._id.toString()
                });
                
                throw new AuthenticationError(
                    ERROR_MESSAGES[ERROR_CODES.AUTH_INVALID_CREDENTIALS],
                    ERROR_CODES.AUTH_INVALID_CREDENTIALS,
                    {
                        suggestion: 'Please check your credentials or reset your password'
                    }
                );
            }
            
            // Generate new tokens
            const tokens = this.generateUserTokens(user);

            // Update refresh token in database
            await this.userRepository.updateRefreshToken(
                user._id.toString(), 
                tokens.refreshToken
            );
            
            logger.info('User logged in successfully', { 
                userId: user._id, 
                email: user.email 
            });

            return {
                user: this.toPublicUser(user),
                tokens
            };

        } catch (error) {
            logger.warn('User login failed', { 
                email: credentials.email, 
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            
            // Re-throw known errors
            if (error instanceof AppError) {
                throw error;
            }
            
            // Wrap unknown errors as authentication errors
            throw new AuthenticationError(
                ERROR_MESSAGES[ERROR_CODES.AUTH_INVALID_CREDENTIALS],
                ERROR_CODES.AUTH_INVALID_CREDENTIALS
            );
        }
    }

    /**
     * Logout user by invalidating refresh token
     * @throws {AppError} If logout fails
     */
    async logout(userId: string): Promise<void> {
        try {
            await this.userRepository.updateRefreshToken(userId, null);
            
            logger.info('User logged out successfully', { userId });
        } catch (error) {
            logger.error('User logout failed', { 
                userId, 
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            
            throw new AppError(
                'Unable to logout. Please try again.',
                500
            );
        }
    }

    /**
     * Refresh access token using valid refresh token
     * @throws {AuthenticationError} If refresh token is invalid or expired
     */
    async refreshToken(refreshToken: string): Promise<AuthTokens> {
        try {
            // Verify refresh token
            const decoded = jwt.verify(
                refreshToken, 
                config.jwt.refreshSecret
            ) as JwtPayload;
            
            // Find user by refresh token
            const user = await this.userRepository.findByRefreshToken(refreshToken);

            // Validate user exists
            if (!user) {
                throw new AuthenticationError(
                    ERROR_MESSAGES[ERROR_CODES.AUTH_TOKEN_INVALID],
                    ERROR_CODES.AUTH_TOKEN_INVALID,
                    {
                        reason: 'Token not found in database',
                        suggestion: 'Please log in again'
                    }
                );
            }

            // Check if account is active
            if (!user.isActive) {
                throw new AuthenticationError(
                    ERROR_MESSAGES[ERROR_CODES.AUTH_ACCOUNT_INACTIVE],
                    ERROR_CODES.AUTH_ACCOUNT_INACTIVE,
                    {
                        userId: user._id.toString(),
                        suggestion: 'Please contact support'
                    }
                );
            }

            // Generate new token pair
            const tokens = this.generateUserTokens(user);

            // Update refresh token in database
            await this.userRepository.updateRefreshToken(
                user._id.toString(), 
                tokens.refreshToken
            );
            
            logger.debug('Access token refreshed successfully', { 
                userId: user._id 
            });

            return tokens;

        } catch (error) {
            // Handle JWT specific errors
            if (error instanceof jwt.TokenExpiredError) {
                throw new AuthenticationError(
                    ERROR_MESSAGES[ERROR_CODES.AUTH_TOKEN_EXPIRED],
                    ERROR_CODES.AUTH_TOKEN_EXPIRED,
                    {
                        expiredAt: error.expiredAt,
                        suggestion: 'Please log in again'
                    }
                );
            }
            
            if (error instanceof jwt.JsonWebTokenError) {
                throw new AuthenticationError(
                    ERROR_MESSAGES[ERROR_CODES.AUTH_TOKEN_INVALID],
                    ERROR_CODES.AUTH_TOKEN_INVALID,
                    {
                        reason: error.message,
                        suggestion: 'Please log in again'
                    }
                );
            }

            logger.error('Token refresh failed', { 
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            
            // Re-throw known errors
            if (error instanceof AppError) {
                throw error;
            }
            
            // Wrap unknown errors
            throw new AuthenticationError(
                ERROR_MESSAGES[ERROR_CODES.AUTH_TOKEN_INVALID],
                ERROR_CODES.AUTH_TOKEN_INVALID
            );
        }
    }
    
    /**
     * Generate access and refresh token pair
     * @private
     */
    private generateTokens(payload: JwtPayload): AuthTokens {
        const accessToken = jwt.sign(
            payload, 
            config.jwt.secret, 
            {
                expiresIn: config.jwt.expiresIn,
                issuer: config.jwt.issuer,
                // audience: config.jwt.audience,
            }
        );

        const refreshToken = jwt.sign(
            payload, 
            config.jwt.refreshSecret, 
            {
                expiresIn: config.jwt.refreshExpiresIn,
                issuer: config.jwt.issuer,
                // audience: config.jwt.audience,
            }
        );
        
        return { accessToken, refreshToken };
    }

    /**
     * Verify and decode JWT token
     * @throws {AuthenticationError} If token is invalid or expired
     */
    verifyToken(token: string): JwtPayload {
        try {
            const decoded = jwt.verify(
                token, 
                config.jwt.secret,
                {
                    issuer: config.jwt.issuer,
                    // audience: config.jwt.audience,
                }
            ) as JwtPayload;
            
            return decoded;
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new AuthenticationError(
                    ERROR_MESSAGES[ERROR_CODES.AUTH_TOKEN_EXPIRED],
                    ERROR_CODES.AUTH_TOKEN_EXPIRED,
                    { expiredAt: error.expiredAt }
                );
            }
            
            if (error instanceof jwt.JsonWebTokenError) {
                throw new AuthenticationError(
                    ERROR_MESSAGES[ERROR_CODES.AUTH_TOKEN_INVALID],
                    ERROR_CODES.AUTH_TOKEN_INVALID,
                    { reason: error.message }
                );
            }
            
            throw new AuthenticationError(
                ERROR_MESSAGES[ERROR_CODES.AUTH_TOKEN_INVALID],
                ERROR_CODES.AUTH_TOKEN_INVALID
            );
        }
    }

    /**
     * Remove sensitive data from user object
     * @private
     */
    private buildJwtPayload(user: IUser): JwtPayload {
        const mode = this.resolveMode(user);
        return {
            id: user._id.toString(),
            email: user.email,
            role: user.role,
            mode,
            ownerStatus: user.ownerProfile?.status,
        };
    }

    public generateUserTokens(user: IUser): AuthTokens {
        return this.generateTokens(this.buildJwtPayload(user));
    }

    public toPublicUser(user: IUser): any {
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

        const mode = this.resolveMode(user);

        return {
            id: user._id.toString(),
            email: user.email,
            role: user.role,
            mode,
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

    private resolveMode(user: IUser): UserMode {
        if (user.mode) {
            return user.mode;
        }
        return user.role === UserRole.OWNER ? UserMode.OWNER : UserMode.PLAYER;
    }
}