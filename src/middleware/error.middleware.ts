import type { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS, ERROR_CODES, ERROR_MESSAGES } from '../config/constants.js';
import logger from '../utils/logger.js';
import { config } from '../config/environment.js';

export interface ErrorResponse {
    success: false;
    message: string;
    code: string;
    timestamp: string;
    path: string;
    method: string;
    details?: any;
    stack?: string;
}

export class AppError extends Error {
    public statusCode: number;
    public code: string;
    public isOperational: boolean;
    public details?: any;

    constructor(message: string, code: string, statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR, details?: any) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
        this.details = details;
        
        Error.captureStackTrace(this, this.constructor);
    }
}

// Specific Error Classes
export class ValidationError extends AppError {
    constructor(message: string = ERROR_MESSAGES[ERROR_CODES.VALIDATION_ERROR], details?: any) {
        super(message, ERROR_CODES.VALIDATION_ERROR, HTTP_STATUS.BAD_REQUEST, details);
    }
}

export class AuthenticationError extends AppError {
    constructor(code: string = ERROR_CODES.AUTH_INVALID_CREDENTIALS, details?: any) {
        super(ERROR_MESSAGES[code], code, HTTP_STATUS.UNAUTHORIZED, details);
    }
}

export class AuthorizationError extends AppError {
    constructor(message: string = ERROR_MESSAGES[ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS], details?: any) {
        super(message, ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS, HTTP_STATUS.FORBIDDEN, details);
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = ERROR_MESSAGES[ERROR_CODES.USER_NOT_FOUND], details?: any) {
        super(message, ERROR_CODES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND, details);
    }
}

export class ConflictError extends AppError {
    constructor(code: string = ERROR_CODES.USER_ALREADY_EXISTS, details?: any) {
        super(ERROR_MESSAGES[code], code, HTTP_STATUS.CONFLICT, details);
    }
}

export class BusinessLogicError extends AppError {
    constructor(code: string, details?: any) {
        super(ERROR_MESSAGES[code], code, HTTP_STATUS.UNPROCESSABLE_ENTITY, details);
    }
}

export class RateLimitError extends AppError {
    constructor(message: string = ERROR_MESSAGES[ERROR_CODES.RATE_LIMIT_EXCEEDED], details?: any) {
        super(message, ERROR_CODES.RATE_LIMIT_EXCEEDED, HTTP_STATUS.TOO_MANY_REQUESTS, details);
    }
}

// 404 Not Found Middleware
export const notFoundHandler = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const error = new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`);
    next(error);
};

// Global Error Handling Middleware
export const errorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    let error = err;

    // Handle specific error types
    if (!(error instanceof AppError)) {
        error = handleSpecificErrors(error);
    }

    // Log the error with appropriate level
    logError(error, req);

    // Determine if we should include error details
    const includeDetails = config.env !== 'production';

    // Prepare error response
    const errorResponse: ErrorResponse = {
        success: false,
        message: error.message,
        code: error.code || ERROR_CODES.INTERNAL_SERVER_ERROR,
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        method: req.method,
    };

    // Add error details in development or for specific error types
    if (includeDetails && error.details) {
        errorResponse.details = error.details;
    }

    // Add stack trace only in development
    if (includeDetails && error.stack) {
        errorResponse.stack = error.stack;
    }

    // Send error response
    res.status(error.statusCode).json(errorResponse);
};

// Handle specific error types and normalize them
function handleSpecificErrors(err: any): AppError {
    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map((e: any) => ({
            field: e.path,
            message: e.message,
            value: e.value
        }));
        
        return new ValidationError(
            ERROR_MESSAGES[ERROR_CODES.VALIDATION_ERROR],
            { validationErrors: errors }
        );
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const value = err.keyValue[field];
        
        if (field === 'email') {
            return new ConflictError(
                ERROR_CODES.USER_ALREADY_EXISTS,
                { duplicateField: field, duplicateValue: value }
            );
        }
        
        return new ConflictError(
            ERROR_CODES.VALIDATION_ERROR,
            { duplicateField: field, duplicateValue: value }
        );
    }

    // Mongoose cast error (invalid ObjectId)
    if (err.name === 'CastError') {
        return new ValidationError(
            `Invalid ${err.path}: ${err.value}`,
            { path: err.path, value: err.value }
        );
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return new AuthenticationError(ERROR_CODES.AUTH_TOKEN_INVALID);
    }

    if (err.name === 'TokenExpiredError') {
        return new AuthenticationError(ERROR_CODES.AUTH_TOKEN_EXPIRED);
    }

    // Syntax error (e.g., invalid JSON in request body)
    if (err instanceof SyntaxError && 'status' in err && err.status === 400 && 'body' in err) {
        return new ValidationError('Invalid JSON in request body');
    }

    // Rate limiting errors
    if (err.status === 429) {
        return new RateLimitError();
    }

    // Default to internal server error
    return new AppError(
        ERROR_MESSAGES[ERROR_CODES.INTERNAL_SERVER_ERROR],
        ERROR_CODES.INTERNAL_SERVER_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
}

// Error logging utility
function logError(error: AppError, req: Request): void {
    const logData = {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: (req as any).user?.id || 'Guest',
        stack: error.stack,
    };

    if (error.statusCode >= 500) {
        // Server errors - log as error
        logger.error('Server Error:', logData);
    } else if (error.statusCode >= 400) {
        // Client errors - log as warn
        logger.warn('Client Error:', logData);
    } else {
        // Other errors - log as info
        logger.info('Application Error:', logData);
    }
}

/**
 * Async error handler wrapper - for handling async route handlers
 */
export const asyncHandler = <T extends Request>(
    fn: (req: T, res: Response, next: NextFunction) => Promise<any>
) => {
    return (req: T, res: Response, next: NextFunction): void => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

export default errorHandler;