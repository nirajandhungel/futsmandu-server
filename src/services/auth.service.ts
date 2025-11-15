import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/user.repository.js';
import { CreateUserDto, LoginDto, AuthTokens, JwtPayload } from '../types/user.types.js';
import { config } from '../config/environment.js';
import { HTTP_STATUS,ERROR_CODES, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../config/constants.js';
import { 
    AuthenticationError, 
    ConflictError,
    AppError 
} from '../middleware/error.middleware.js';
import logger from '../utils/logger.js';

export class AuthService {
    private userRepository: UserRepository;

    constructor() {
        this.userRepository = new UserRepository();
    }

    // Register a new user
    async register(userData: CreateUserDto): Promise<{ user: any; tokens: AuthTokens }> {
        try {
            // Check if user already exists
            const existingUser = await this.userRepository.findByEmail(userData.email);
            if (existingUser) {
                throw new ConflictError(ERROR_CODES.USER_ALREADY_EXISTS, {
                    email: userData.email,
                    suggestion: 'Try logging in or use a different email address'
                });
            }

            const newUser = await this.userRepository.create(userData);
            
            // Generate tokens
            const tokens = this.generateTokens({
                id: newUser._id.toString(),
                email: newUser.email,
                role: newUser.role,
            });

            // Save refresh token 
            await this.userRepository.updateRefreshToken(newUser._id.toString(), tokens.refreshToken);
            
            logger.info('User registered successfully', { 
                userId: newUser._id, 
                email: newUser.email,
                role: newUser.role 
            });

            return {
                user: {
                    id: newUser._id.toString(),
                    email: newUser.email,
                    role: newUser.role,
                    fullName: newUser.fullName,
                    isActive: newUser.isActive,
                },
                tokens
            };

        } catch (error) {
            logger.error('User registration failed', { 
                email: userData.email, 
                error: error instanceof Error ? error.message : error 
            });
            throw error;
        }
    }

    // Login user
    async login(credentials: LoginDto): Promise<{ user: any; tokens: AuthTokens }> {
        try {
            // Find user with password (you'll need to implement this method in repository)
            const user = await this.userRepository.findByEmailWithPassword(credentials.email);
            
            if (!user) {
                throw new AuthenticationError(ERROR_CODES.AUTH_INVALID_CREDENTIALS, {
                    email: credentials.email,
                    suggestion: 'Check your email and password or reset your password'
                });
            }

            // Check if user account is active
            if (!user.isActive) {
                throw new AuthenticationError(ERROR_CODES.AUTH_ACCOUNT_INACTIVE, {
                    userId: user._id.toString(),
                    email: user.email
                });
            }

            // Validate password
            const isPasswordValid = await user.comparePassword(credentials.password);
            if (!isPasswordValid) {
                throw new AuthenticationError(ERROR_CODES.AUTH_INVALID_CREDENTIALS, {
                    email: credentials.email,
                    failedAttempt: true
                });
            }
            
            // Generate tokens
            const tokens = this.generateTokens({
                id: user._id.toString(),
                email: user.email,
                role: user.role,
            });

            // Save refresh token
            await this.userRepository.updateRefreshToken(user._id.toString(), tokens.refreshToken);
            
            logger.info('User logged in successfully', { 
                userId: user._id, 
                email: user.email 
            });

            return {
                user: {
                    id: user._id.toString(),
                    email: user.email,
                    role: user.role,
                    fullName: user.fullName,
                    isActive: user.isActive,
                },
                tokens
            };

        } catch (error) {
            logger.warn('User login failed', { 
                email: credentials.email, 
                error: error instanceof Error ? error.message : error 
            });
            throw error;
        }
    }

    // Logout user
    async logout(userId: string): Promise<void> {
        try {
            await this.userRepository.updateRefreshToken(userId, null);
            logger.info('User logged out successfully', { userId });
        } catch (error) {
            logger.error('User logout failed', { userId, error });
            throw new AppError(
                'Logout failed',
                ERROR_CODES.INTERNAL_SERVER_ERROR,
                HTTP_STATUS.INTERNAL_SERVER_ERROR
            );
        }
    }

    // Refresh access token
    async refreshToken(refreshToken: string): Promise<AuthTokens> {
        try {
            // Verify refresh token
            const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as JwtPayload;
            
            // Find user with this refresh token (you'll need to implement this method)
            const user = await this.userRepository.findByRefreshToken(refreshToken);

            // If user not found or inactive
            if (!user) {
                throw new AuthenticationError(ERROR_CODES.AUTH_TOKEN_INVALID, {
                    reason: 'User not found for refresh token'
                });
            }

            if (!user.isActive) {
                throw new AuthenticationError(ERROR_CODES.AUTH_ACCOUNT_INACTIVE, {
                    userId: user._id.toString()
                });
            }

            // Generate new tokens
            const tokens = this.generateTokens({
                id: user._id.toString(),
                email: user.email,
                role: user.role,
            });

            // Update refresh token
            await this.userRepository.updateRefreshToken(user._id.toString(), tokens.refreshToken);
            
            logger.debug('Token refreshed successfully', { userId: user._id });

            return tokens;

        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new AuthenticationError(ERROR_CODES.AUTH_TOKEN_EXPIRED, {
                    suggestion: 'Please log in again'
                });
            }
            
            if (error instanceof jwt.JsonWebTokenError) {
                throw new AuthenticationError(ERROR_CODES.AUTH_TOKEN_INVALID, {
                    reason: 'Invalid refresh token'
                });
            }

            logger.error('Token refresh failed', { error });
            throw error; // Re-throw the error to be handled by the error middleware
        }
    }
    
    // Generate access and refresh tokens
    private generateTokens(payload: JwtPayload): AuthTokens {
        const accessToken = jwt.sign(payload, config.jwt.secret, {
            expiresIn: config.jwt.expiresIn,
            issuer: config.jwt.issuer,
        });

        const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
            expiresIn: config.jwt.refreshExpiresIn,
            issuer: config.jwt.issuer,
        });
        
        return { accessToken, refreshToken };
    }

    // Verify token
    verifyToken(token: string): JwtPayload {
        try {
            const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
            return decoded;
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new AuthenticationError(ERROR_CODES.AUTH_TOKEN_EXPIRED);
            }
            
            if (error instanceof jwt.JsonWebTokenError) {
                throw new AuthenticationError(ERROR_CODES.AUTH_TOKEN_INVALID);
            }
            
            throw new AuthenticationError(ERROR_CODES.AUTH_TOKEN_INVALID);
        }
    }
}