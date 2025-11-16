import type { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS, ERROR_CODES, ERROR_MESSAGES } from '../config/constants.js';
import logger from '../utils/logger.js';
import { config } from '../config/environment.js';

/**
 * Standardized error response interface
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  meta: {
    timestamp: string;
    path: string;
    method: string;
    requestId?: string;
  };
  stack?: string;
}

/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly isOperational: boolean;

  constructor(
    public readonly message: string,
    public readonly statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    public readonly code: string = ERROR_CODES.INTERNAL_ERROR,
    public readonly details?: any,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 404 Not Found Error
 */
export class NotFoundError extends AppError {
  constructor(
    resource: string = 'Resource',
    code: string = ERROR_CODES.RESOURCE_NOT_FOUND,
    details?: any
  ) {
    const message = ERROR_MESSAGES[code] || `${resource} not found`;
    super(message, HTTP_STATUS.NOT_FOUND, code, details);
  }
}

/**
 * 409 Conflict Error
 */
export class ConflictError extends AppError {
  constructor(
    message: string = ERROR_MESSAGES[ERROR_CODES.RESOURCE_CONFLICT],
    code: string = ERROR_CODES.RESOURCE_CONFLICT,
    details?: any
  ) {
    super(message, HTTP_STATUS.CONFLICT, code, details);
  }
}

/**
 * 400 Bad Request / Validation Error
 */
export class ValidationError extends AppError {
  constructor(
    message: string = ERROR_MESSAGES[ERROR_CODES.VALIDATION_FAILED],
    details?: any
  ) {
    super(
      message,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_FAILED,
      details
    );
  }
}

/**
 * 401 Unauthorized Error
 */
export class AuthenticationError extends AppError {
  constructor(
    message: string = ERROR_MESSAGES[ERROR_CODES.AUTH_INVALID_CREDENTIALS],
    code: string = ERROR_CODES.AUTH_INVALID_CREDENTIALS,
    details?: any
  ) {
    super(message, HTTP_STATUS.UNAUTHORIZED, code, details);
  }
}

/**
 * 403 Forbidden Error
 */
export class AuthorizationError extends AppError {
  constructor(
    message: string = ERROR_MESSAGES[ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS],
    code: string = ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
    details?: any
  ) {
    super(message, HTTP_STATUS.FORBIDDEN, code, details);
  }
}

/**
 * 422 Unprocessable Entity / Business Logic Error
 */
export class BusinessLogicError extends AppError {
  constructor(
    message: string,
    code: string,
    details?: any
  ) {
    super(message, HTTP_STATUS.UNPROCESSABLE_ENTITY, code, details);
  }
}

/**
 * 429 Too Many Requests Error
 */
export class RateLimitError extends AppError {
  constructor(
    message: string = ERROR_MESSAGES[ERROR_CODES.RATE_LIMIT_EXCEEDED],
    details?: any
  ) {
    super(
      message,
      HTTP_STATUS.TOO_MANY_REQUESTS,
      ERROR_CODES.RATE_LIMIT_EXCEEDED,
      details
    );
  }
}

/**
 * 503 Service Unavailable Error
 */
export class ServiceUnavailableError extends AppError {
  constructor(
    message: string = ERROR_MESSAGES[ERROR_CODES.SERVICE_UNAVAILABLE],
    details?: any
  ) {
    super(
      message,
      HTTP_STATUS.SERVICE_UNAVAILABLE,
      ERROR_CODES.SERVICE_UNAVAILABLE,
      details
    );
  }
}

/**
 * 404 Not Found Middleware - Catches all unmatched routes
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = new NotFoundError(
    `Route not found`,
    ERROR_CODES.RESOURCE_NOT_FOUND,
    {
      route: `${req.method} ${req.originalUrl}`,
      availableRoutes: 'Please check the API documentation for available endpoints'
    }
  );
  next(error);
};

/**
 * Global Error Handling Middleware
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = err;

  // Convert non-AppError instances to AppError
  if (!(error instanceof AppError)) {
    error = handleSpecificErrors(error);
  }

  // Log the error with appropriate level
  logError(error, req);

  // Prepare standardized error response
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      ...(shouldIncludeDetails(error) && error.details && { details: error.details })
    },
    meta: {
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method,
    //   ...(req.id && { requestId: req.id })
    }
  };

  // Include stack trace only in development environment
  if (config.env === 'development' && error.stack) {
    errorResponse.stack = error.stack;
  }

  // Send error response
  res.status(error.statusCode).json(errorResponse);
};

/**
 * Convert specific error types to AppError instances
 */
function handleSpecificErrors(err: any): AppError {
  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e: any) => ({
      field: e.path,
      message: e.message,
      value: e.value,
      kind: e.kind
    }));
    
    return new ValidationError(
      'One or more fields failed validation',
      { validationErrors: errors }
    );
  }

  // Mongoose Duplicate Key Error (11000)
  if (err.code === 11000 || err.code === 11001) {
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0];
    const value = err.keyValue?.[field];
    
    return new ConflictError(
      `A record with this ${field} already exists`,
      ERROR_CODES.RESOURCE_ALREADY_EXISTS,
      {
        field,
        value,
        message: 'Please use a different value'
      }
    );
  }

  // Mongoose Cast Error (Invalid ObjectId, type mismatch)
  if (err.name === 'CastError') {
    return new ValidationError(
      `Invalid ${err.path}: ${err.value}`,
      {
        field: err.path,
        value: err.value,
        expectedType: err.kind,
        message: `Expected ${err.kind} but received ${typeof err.value}`
      }
    );
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return new AuthenticationError(
      ERROR_MESSAGES[ERROR_CODES.AUTH_TOKEN_INVALID],
      ERROR_CODES.AUTH_TOKEN_INVALID,
      { reason: err.message }
    );
  }

  if (err.name === 'TokenExpiredError') {
    return new AuthenticationError(
      ERROR_MESSAGES[ERROR_CODES.AUTH_TOKEN_EXPIRED],
      ERROR_CODES.AUTH_TOKEN_EXPIRED,
      { expiredAt: err.expiredAt }
    );
  }

  // Multer Errors (File Upload)
  if (err.name === 'MulterError') {
    return new ValidationError(
      'File upload error: ' + err.message,
      {
        code: err.code,
        field: err.field,
        message: getMulterErrorMessage(err.code)
      }
    );
  }

  // Syntax Errors (Malformed JSON)
  if (err instanceof SyntaxError && 'body' in err) {
    return new ValidationError(
      'Invalid JSON format in request body',
      { originalError: err.message }
    );
  }

  // Database Connection Errors
  if (err.name === 'MongoNetworkError' || err.name === 'MongooseServerSelectionError') {
    return new ServiceUnavailableError(
      ERROR_MESSAGES[ERROR_CODES.DATABASE_ERROR],
      { reason: 'Database connection failed' }
    );
  }

  // Default Internal Server Error
  return new AppError(
    ERROR_MESSAGES[ERROR_CODES.INTERNAL_ERROR],
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    ERROR_CODES.INTERNAL_ERROR,
    config.env === 'development' ? { originalError: err.message } : undefined,
    false // Mark as non-operational
  );
}

/**
 * Log error with appropriate severity level
 */
function logError(error: AppError, req: Request): void {
  const logData = {
    name: error.name,
    message: error.message,
    code: error.code,
    statusCode: error.statusCode,
    path: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: (req as any).user?.id || 'anonymous',
    // ...(req.id && { requestId: req.id }),
    ...(error.details && { details: error.details })
  };

  // Server errors (5xx) - Log as error with stack trace
  if (error.statusCode >= 500) {
    logger.error('Server Error', {
      ...logData,
      stack: error.stack,
      isOperational: error.isOperational
    });
  }
  // Client errors (4xx) - Log as warning
  else if (error.statusCode >= 400) {
    logger.warn('Client Error', logData);
  }
  // Other errors - Log as info
  else {
    logger.info('Application Error', logData);
  }
}

/**
 * Determine if error details should be included in response
 */
function shouldIncludeDetails(error: AppError): boolean {
  // Always include details for client errors in development
  if (config.env === 'development') {
    return true;
  }
  
  // In production, only include details for client errors (4xx)
  return error.statusCode >= 400 && error.statusCode < 500;
}

/**
 * Get user-friendly message for Multer errors
 */
function getMulterErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    LIMIT_FILE_SIZE: 'File size exceeds the maximum allowed limit',
    LIMIT_FILE_COUNT: 'Too many files uploaded',
    LIMIT_UNEXPECTED_FILE: 'Unexpected field in file upload',
    LIMIT_FIELD_KEY: 'Field name is too long',
    LIMIT_FIELD_VALUE: 'Field value is too long',
    LIMIT_FIELD_COUNT: 'Too many fields',
    LIMIT_PART_COUNT: 'Too many parts in multipart request'
  };
  
  return messages[code] || 'File upload error';
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = <T extends Request = Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: T, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default errorHandler;