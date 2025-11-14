export const APP_CONSTANTS={
    DEFAULT_PAGE:1,
    DEFAULT_LIMIT:10,
    MAX_LIMIT:100,
    MIN_PASSWORD_LENGTH:8,
    MAX_TEAM_SIZE:10,
    MIN_BOOKING_HOURS_AHEAD:1,
    MAX_BOOKING_HOURS_AHEAD:72,
    BOOKING_ADVANCE_DAYS:3,
    PARTIAL_TEAM_MIN_PLAYERS:3,
    PARTIAL_TEAM_MAX_PLAYERS:7
};

export const HTTP_STATUS={
    OK:200,
    CREATED:201,
    BAD_REQUEST:400,
    UNAUTHORIZED:401,
    FORBIDDEN:403,
    NOT_FOUND:404,
    CONFLICT:409,
    UNPROCESSABLE_ENTITY:422,
    INTERNAL_SERVER_ERROR:500,
};

export const ERROR_MESSAGES={
    INVALID_CREDENTIALS:'Invalid email or password',
    EMAIL_EXISTS:'Email already exists',
    USER_NOT_FOUND:'User not found',
    UNAUTHORIZED:'Unauthorized access',
    FORBIDDEN:'Forbidden access',
    BOOKING_NOT_FOUND:'Booking not found',
    SLOT_UNAVAILABLE:'Selected time slot is not available',
    INVALID_BOOKING_TIME:'Invalid booking time',
    BOOKING_FULL:'Booking id full',
    CANNOT_JOIN_OWN_BOOKING:'Cannot join you own booking',
    INSUFFICENT_SLOTS:"Not enough slots available",
    INTERNAL_ERROR:'An internal server error occurred',
    INVALID_TOKEN:'Invalid or expired token',
    TOKEN_REQUIRED:'Authentication token required',
    NOT_FOUND:'Resource not found'
};