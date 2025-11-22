export const APP_CONSTANTS = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
    MIN_PASSWORD_LENGTH: 8,
    MAX_TEAM_SIZE: 10,
    MIN_BOOKING_HOURS_AHEAD: 1,
    MAX_BOOKING_HOURS_AHEAD: 72,
    BOOKING_ADVANCE_DAYS: 3,
    PARTIAL_TEAM_MIN_PLAYERS: 3,
    PARTIAL_TEAM_MAX_PLAYERS: 7
} as const;

export const HTTP_STATUS = {
    // Success
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,

    // Client Errors
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,

    // Server Errors
    INTERNAL_SERVER_ERROR: 500,
    NOT_IMPLEMENTED: 501,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Standardized error codes following industry pattern: DOMAIN_SPECIFIC_DESCRIPTION
 * Format: <DOMAIN>_<ENTITY>_<ACTION/STATE>
 */
export const ERROR_CODES = {
    // Authentication Errors (1000-1099)
    AUTH_INVALID_CREDENTIALS: 'AUTH_1001',
    AUTH_TOKEN_EXPIRED: 'AUTH_1002',
    AUTH_TOKEN_INVALID: 'AUTH_1003',
    AUTH_TOKEN_MISSING: 'AUTH_1004',
    AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH_1005',
    AUTH_ACCOUNT_INACTIVE: 'AUTH_1006',
    AUTH_EMAIL_NOT_VERIFIED: 'AUTH_1007',
    AUTH_ACCOUNT_LOCKED: 'AUTH_1008',
    AUTH_SESSION_EXPIRED: 'AUTH_1009',

    // User Errors (2000-2099)
    USER_NOT_FOUND: 'USER_2001',
    USER_ALREADY_EXISTS: 'USER_2002',
    USER_CREATION_FAILED: 'USER_2003',
    USER_UPDATE_FAILED: 'USER_2004',
    USER_DELETION_FAILED: 'USER_2005',
    USER_PROFILE_INCOMPLETE: 'USER_2006',
    USER_SUSPENDED: 'USER_2007',

    // Validation Errors (3000-3099)
    VALIDATION_FAILED: 'VAL_3001',
    VALIDATION_REQUIRED_FIELD: 'VAL_3002',
    VALIDATION_INVALID_EMAIL: 'VAL_3003',
    VALIDATION_INVALID_PASSWORD: 'VAL_3004',
    VALIDATION_PASSWORD_WEAK: 'VAL_3005',
    VALIDATION_INVALID_PHONE: 'VAL_3006',
    VALIDATION_INVALID_FORMAT: 'VAL_3007',
    VALIDATION_OUT_OF_RANGE: 'VAL_3008',
    VALIDATION_INVALID_TYPE: 'VAL_3009',

    // Booking Errors (4000-4099)
    BOOKING_NOT_FOUND: 'BOOKING_4001',
    BOOKING_CREATION_FAILED: 'BOOKING_4002',
    BOOKING_UPDATE_FAILED: 'BOOKING_4003',
    BOOKING_CANCELLATION_FAILED: 'BOOKING_4004',
    BOOKING_SLOT_UNAVAILABLE: 'BOOKING_4005',
    BOOKING_INVALID_TIME: 'BOOKING_4006',
    BOOKING_ALREADY_FULL: 'BOOKING_4007',
    BOOKING_CANNOT_JOIN_OWN: 'BOOKING_4008',
    BOOKING_INSUFFICIENT_SLOTS: 'BOOKING_4009',
    BOOKING_PAST_DEADLINE: 'BOOKING_4010',
    BOOKING_DUPLICATE: 'BOOKING_4011',

    // Court Errors (5000-5099)
    COURT_NOT_FOUND: 'COURT_5001',
    COURT_UNAVAILABLE: 'COURT_5002',
    COURT_MAINTENANCE: 'COURT_5003',

    // Tournament Errors (6000-6099)
    TOURNAMENT_NOT_FOUND: 'TOURNAMENT_6001',
    TOURNAMENT_FULL: 'TOURNAMENT_6002',
    TOURNAMENT_REGISTRATION_CLOSED: 'TOURNAMENT_6003',
    TOURNAMENT_ALREADY_STARTED: 'TOURNAMENT_6004',

    // Payment Errors (7000-7099)
    PAYMENT_FAILED: 'PAYMENT_7001',
    PAYMENT_PROCESSING: 'PAYMENT_7002',
    PAYMENT_INVALID_METHOD: 'PAYMENT_7003',
    PAYMENT_INSUFFICIENT_FUNDS: 'PAYMENT_7004',
    PAYMENT_REFUND_FAILED: 'PAYMENT_7005',

    // System Errors (9000-9099)
    INTERNAL_ERROR: 'SYS_9001',
    DATABASE_ERROR: 'SYS_9002',
    EXTERNAL_SERVICE_ERROR: 'SYS_9003',
    RATE_LIMIT_EXCEEDED: 'SYS_9004',
    SERVICE_UNAVAILABLE: 'SYS_9005',
    NETWORK_ERROR: 'SYS_9006',

    // Resource Errors (8000-8099)
    RESOURCE_NOT_FOUND: 'RES_8001',
    RESOURCE_ALREADY_EXISTS: 'RES_8002',
    RESOURCE_CONFLICT: 'RES_8003',
} as const;

/**
 * User-friendly error messages mapped to error codes
 * These should be clear, actionable, and non-technical for end users
 */
export const ERROR_MESSAGES: Record<string, string> = {
    // Authentication
    [ERROR_CODES.AUTH_INVALID_CREDENTIALS]: 'The email or password you entered is incorrect.',
    [ERROR_CODES.AUTH_TOKEN_EXPIRED]: 'Your session has expired. Please log in again.',
    [ERROR_CODES.AUTH_TOKEN_INVALID]: 'Invalid authentication token. Please log in again.',
    [ERROR_CODES.AUTH_TOKEN_MISSING]: 'Authentication required. Please log in to continue.',
    [ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS]: 'You do not have permission to perform this action.',
    [ERROR_CODES.AUTH_ACCOUNT_INACTIVE]: 'Your account is inactive. Please contact support for assistance.',
    [ERROR_CODES.AUTH_EMAIL_NOT_VERIFIED]: 'Please verify your email address to continue.',
    [ERROR_CODES.AUTH_ACCOUNT_LOCKED]: 'Your account has been locked due to multiple failed login attempts. Please reset your password or contact support.',
    [ERROR_CODES.AUTH_SESSION_EXPIRED]: 'Your session has expired. Please log in again.',

    // User
    [ERROR_CODES.USER_NOT_FOUND]: 'User account not found.',
    [ERROR_CODES.USER_ALREADY_EXISTS]: 'An account with this email already exists.',
    [ERROR_CODES.USER_CREATION_FAILED]: 'Unable to create user account. Please try again.',
    [ERROR_CODES.USER_UPDATE_FAILED]: 'Unable to update user profile. Please try again.',
    [ERROR_CODES.USER_DELETION_FAILED]: 'Unable to delete user account. Please try again.',
    [ERROR_CODES.USER_PROFILE_INCOMPLETE]: 'Please complete your profile to continue.',
    [ERROR_CODES.USER_SUSPENDED]: 'Your account has been suspended. Please contact support.',

    // Validation
    [ERROR_CODES.VALIDATION_FAILED]: 'Please check your input and try again.',
    [ERROR_CODES.VALIDATION_REQUIRED_FIELD]: 'This field is required.',
    [ERROR_CODES.VALIDATION_INVALID_EMAIL]: 'Please enter a valid email address.',
    [ERROR_CODES.VALIDATION_INVALID_PASSWORD]: 'Password does not meet requirements.',
    [ERROR_CODES.VALIDATION_PASSWORD_WEAK]: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.',
    [ERROR_CODES.VALIDATION_INVALID_PHONE]: 'Please enter a valid phone number.',
    [ERROR_CODES.VALIDATION_INVALID_FORMAT]: 'Invalid format. Please check your input.',
    [ERROR_CODES.VALIDATION_OUT_OF_RANGE]: 'Value is out of acceptable range.',
    [ERROR_CODES.VALIDATION_INVALID_TYPE]: 'Invalid data type provided.',

    // Booking
    [ERROR_CODES.BOOKING_NOT_FOUND]: 'Booking not found.',
    [ERROR_CODES.BOOKING_CREATION_FAILED]: 'Unable to create booking. Please try again.',
    [ERROR_CODES.BOOKING_UPDATE_FAILED]: 'Unable to update booking. Please try again.',
    [ERROR_CODES.BOOKING_CANCELLATION_FAILED]: 'Unable to cancel booking. Please try again.',
    [ERROR_CODES.BOOKING_SLOT_UNAVAILABLE]: 'The selected time slot is no longer available.',
    [ERROR_CODES.BOOKING_INVALID_TIME]: 'Please select a valid future time slot.',
    [ERROR_CODES.BOOKING_ALREADY_FULL]: 'This booking is already at full capacity.',
    [ERROR_CODES.BOOKING_CANNOT_JOIN_OWN]: 'You cannot join your own booking.',
    [ERROR_CODES.BOOKING_INSUFFICIENT_SLOTS]: 'Not enough slots available for your request.',
    [ERROR_CODES.BOOKING_PAST_DEADLINE]: 'Booking deadline has passed.',
    [ERROR_CODES.BOOKING_DUPLICATE]: 'You already have a booking for this time slot.',

    // Court
    [ERROR_CODES.COURT_NOT_FOUND]: 'Court not found.',
    [ERROR_CODES.COURT_UNAVAILABLE]: 'This court is currently unavailable.',
    [ERROR_CODES.COURT_MAINTENANCE]: 'This court is under maintenance.',

    // Tournament
    [ERROR_CODES.TOURNAMENT_NOT_FOUND]: 'Tournament not found.',
    [ERROR_CODES.TOURNAMENT_FULL]: 'This tournament has reached maximum capacity.',
    [ERROR_CODES.TOURNAMENT_REGISTRATION_CLOSED]: 'Registration for this tournament is closed.',
    [ERROR_CODES.TOURNAMENT_ALREADY_STARTED]: 'This tournament has already started.',

    // Payment
    [ERROR_CODES.PAYMENT_FAILED]: 'Payment processing failed. Please try again or use a different payment method.',
    [ERROR_CODES.PAYMENT_PROCESSING]: 'Payment is being processed. Please wait.',
    [ERROR_CODES.PAYMENT_INVALID_METHOD]: 'Invalid payment method.',
    [ERROR_CODES.PAYMENT_INSUFFICIENT_FUNDS]: 'Insufficient funds. Please use a different payment method.',
    [ERROR_CODES.PAYMENT_REFUND_FAILED]: 'Refund processing failed. Please contact support.',

    // System
    [ERROR_CODES.INTERNAL_ERROR]: 'An unexpected error occurred. Please try again later.',
    [ERROR_CODES.DATABASE_ERROR]: 'A database error occurred. Please try again later.',
    [ERROR_CODES.EXTERNAL_SERVICE_ERROR]: 'An external service is temporarily unavailable. Please try again later.',
    [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please slow down and try again.',
    [ERROR_CODES.SERVICE_UNAVAILABLE]: 'Service is temporarily unavailable. Please try again later.',
    [ERROR_CODES.NETWORK_ERROR]: 'Network error occurred. Please check your connection.',

    // Resource
    [ERROR_CODES.RESOURCE_NOT_FOUND]: 'The requested resource was not found.',
    [ERROR_CODES.RESOURCE_ALREADY_EXISTS]: 'This resource already exists.',
    [ERROR_CODES.RESOURCE_CONFLICT]: 'A conflict occurred with the current state of the resource.',
    
    // Direct error message properties (for backward compatibility with auth middleware)
    TOKEN_REQUIRED: 'Authentication token is required.',
    UNAUTHORIZED: 'Unauthorized access. Please log in to continue.',
    FORBIDDEN: 'Access forbidden. You do not have permission to perform this action.',
};

/**
 * Success messages for consistent positive feedback
 */
export const SUCCESS_MESSAGES = {
    // Authentication
    USER_REGISTERED: 'Account created successfully! Please check your email to verify your account.',
    USER_LOGGED_IN: 'Welcome back! You have successfully logged in.',
    USER_LOGGED_OUT: 'You have been logged out successfully.',
    TOKEN_REFRESHED: 'Session refreshed successfully.',
    
    // Password
    PASSWORD_RESET_REQUESTED: 'Password reset instructions have been sent to your email.',
    PASSWORD_RESET_SUCCESS: 'Your password has been reset successfully.',
    PASSWORD_CHANGED: 'Password changed successfully.',
    
    // Profile
    PROFILE_UPDATED: 'Your profile has been updated successfully.',
    PROFILE_CREATED: 'Profile created successfully.',
    EMAIL_VERIFIED: 'Email verified successfully.',
    
    // Booking
    BOOKING_CREATED: 'Booking created successfully!',
    BOOKING_UPDATED: 'Booking updated successfully.',
    BOOKING_CANCELLED: 'Booking cancelled successfully.',
    BOOKING_JOINED: 'You have successfully joined the booking.',
    
    // Payment
    PAYMENT_SUCCESS: 'Payment processed successfully.',
    REFUND_INITIATED: 'Refund has been initiated and will be processed within 5-7 business days.',
    
    // General
    OPERATION_SUCCESS: 'Operation completed successfully.',
    DATA_SAVED: 'Data saved successfully.',
    DATA_DELETED: 'Data deleted successfully.',
} as const;

/**
 * Type exports for better type safety
 */
export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
export type HttpStatus = typeof HTTP_STATUS[keyof typeof HTTP_STATUS];
export type SuccessMessage = typeof SUCCESS_MESSAGES[keyof typeof SUCCESS_MESSAGES];