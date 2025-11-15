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
};

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
};

export const ERROR_CODES = {
    // Authentication & Authorization (AUTH_*)
    AUTH_INVALID_CREDENTIALS: 'AUTH_001',
    AUTH_TOKEN_EXPIRED: 'AUTH_002',
    AUTH_TOKEN_INVALID: 'AUTH_003',
    AUTH_TOKEN_REQUIRED: 'AUTH_004',
    AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH_005',
    AUTH_ACCOUNT_INACTIVE: 'AUTH_006',
    AUTH_EMAIL_NOT_VERIFIED: 'AUTH_007',

    // User Management (USER_*)
    USER_ALREADY_EXISTS: 'USER_001',
    USER_NOT_FOUND: 'USER_002',
    USER_PROFILE_INCOMPLETE: 'USER_003',
    USER_SUSPENDED: 'USER_004',

    // Validation Errors (VAL_*)
    VALIDATION_ERROR: 'VAL_001',
    REQUIRED_FIELD: 'VAL_002',
    INVALID_EMAIL: 'VAL_003',
    INVALID_PASSWORD: 'VAL_004',
    PASSWORD_TOO_WEAK: 'VAL_005',
    INVALID_PHONE: 'VAL_006',

    // Business Logic (BIZ_*)
    BOOKING_NOT_FOUND: 'BIZ_001',
    SLOT_UNAVAILABLE: 'BIZ_002',
    INVALID_BOOKING_TIME: 'BIZ_003',
    BOOKING_FULL: 'BIZ_004',
    CANNOT_JOIN_OWN_BOOKING: 'BIZ_005',
    INSUFFICIENT_SLOTS: 'BIZ_006',
    COURT_NOT_FOUND: 'BIZ_007',
    TOURNAMENT_FULL: 'BIZ_008',
    PAYMENT_FAILED: 'BIZ_009',

    // System Errors (SYS_*)
    INTERNAL_SERVER_ERROR: 'SYS_001',
    DATABASE_ERROR: 'SYS_002',
    EXTERNAL_SERVICE_ERROR: 'SYS_003',
    RATE_LIMIT_EXCEEDED: 'SYS_004',
};

export const ERROR_MESSAGES = {
    // Authentication & Authorization
    [ERROR_CODES.AUTH_INVALID_CREDENTIALS]: 'Invalid email or password',
    [ERROR_CODES.AUTH_TOKEN_EXPIRED]: 'Your session has expired. Please log in again.',
    [ERROR_CODES.AUTH_TOKEN_INVALID]: 'Invalid authentication token',
    [ERROR_CODES.AUTH_TOKEN_REQUIRED]: 'Authentication token is required',
    [ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS]: 'You do not have permission to perform this action',
    [ERROR_CODES.AUTH_ACCOUNT_INACTIVE]: 'Your account has been deactivated. Please contact support.',
    [ERROR_CODES.AUTH_EMAIL_NOT_VERIFIED]: 'Please verify your email address before proceeding',

    // User Management
    [ERROR_CODES.USER_ALREADY_EXISTS]: 'An account with this email already exists',
    [ERROR_CODES.USER_NOT_FOUND]: 'User not found',
    [ERROR_CODES.USER_PROFILE_INCOMPLETE]: 'Please complete your profile to continue',
    [ERROR_CODES.USER_SUSPENDED]: 'Your account has been suspended. Please contact support.',

    // Validation
    [ERROR_CODES.VALIDATION_ERROR]: 'Validation failed',
    [ERROR_CODES.REQUIRED_FIELD]: 'This field is required',
    [ERROR_CODES.INVALID_EMAIL]: 'Please provide a valid email address',
    [ERROR_CODES.INVALID_PASSWORD]: 'Invalid password',
    [ERROR_CODES.PASSWORD_TOO_WEAK]: 'Password must be at least 8 characters long and include uppercase, lowercase, and numbers',
    [ERROR_CODES.INVALID_PHONE]: 'Please provide a valid phone number',

    // Business Logic
    [ERROR_CODES.BOOKING_NOT_FOUND]: 'Booking not found',
    [ERROR_CODES.SLOT_UNAVAILABLE]: 'Selected time slot is not available',
    [ERROR_CODES.INVALID_BOOKING_TIME]: 'Invalid booking time. Please select a future time slot.',
    [ERROR_CODES.BOOKING_FULL]: 'This booking is already full',
    [ERROR_CODES.CANNOT_JOIN_OWN_BOOKING]: 'You cannot join your own booking',
    [ERROR_CODES.INSUFFICIENT_SLOTS]: 'Not enough slots available for your request',
    [ERROR_CODES.COURT_NOT_FOUND]: 'Futsal court not found',
    [ERROR_CODES.TOURNAMENT_FULL]: 'Tournament is already full',
    [ERROR_CODES.PAYMENT_FAILED]: 'Payment processing failed. Please try again.',

    // System Errors
    [ERROR_CODES.INTERNAL_SERVER_ERROR]: 'An internal server error occurred. Please try again later.',
    [ERROR_CODES.DATABASE_ERROR]: 'Database operation failed',
    [ERROR_CODES.EXTERNAL_SERVICE_ERROR]: 'External service temporarily unavailable',
    [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please try again later.',
};

// Success messages for consistent responses
export const SUCCESS_MESSAGES = {
    USER_REGISTERED: 'Account created successfully. Please check your email for verification.',
    USER_LOGGED_IN: 'Login successful',
    USER_LOGGED_OUT: 'Logout successful',
    PASSWORD_RESET_SENT: 'Password reset instructions sent to your email',
    PASSWORD_RESET_SUCCESS: 'Password reset successfully',
    PROFILE_UPDATED: 'Profile updated successfully',
    BOOKING_CREATED: 'Booking created successfully',
    BOOKING_CANCELLED: 'Booking cancelled successfully',
    PAYMENT_SUCCESS: 'Payment processed successfully',
};