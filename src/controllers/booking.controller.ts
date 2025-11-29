import { Request, Response, NextFunction } from 'express';
import { BookingService } from '../services/booking.service.js';
import { HTTP_STATUS, SUCCESS_MESSAGES, ERROR_CODES, ERROR_MESSAGES } from '../config/constants.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { sendSuccess } from '../utils/responseHandler.js';
import {
  CreateBookingRequest,
  JoinBookingRequest,
  InvitePlayersRequest,
  BookingSearchQuery
} from '../types/booking.types.js';
import logger from '../utils/logger.js';

const bookingService = new BookingService();

/**
 * Create a new booking
 * POST /api/bookings
 */
export const createBooking = asyncHandler(async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const bookingData: CreateBookingRequest = req.body;
  const userId = req.user!.id;

  const booking = await bookingService.createBooking(userId, bookingData);

  logger.info('Booking created successfully', {
    bookingId: booking.id,
    userId,
    courtId: bookingData.courtId,
    bookingType: bookingData.bookingType
  });

  sendSuccess(
    res,
    { booking },
    SUCCESS_MESSAGES.BOOKING_CREATED || 'Booking created successfully',
    HTTP_STATUS.CREATED
  );
});

/**
 * Join a booking
 * POST /api/bookings/:id/join
 */
export const joinBooking = asyncHandler(async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id: bookingId } = req.params;
  const userId = req.user!.id;

  const result = await bookingService.joinBooking(userId, bookingId);

  logger.info('Player joined booking', {
    bookingId,
    userId,
    autoConfirmed: result.autoConfirmed,
    currentPlayers: result.booking.players?.filter((p: any) => p.status === 'active').length || 0
  });

  sendSuccess(
    res,
    result,
    result.autoConfirmed 
      ? 'Booking joined and auto-confirmed (group is now full)' 
      : (SUCCESS_MESSAGES.BOOKING_JOINED || 'Successfully joined the booking'),
    HTTP_STATUS.OK
  );
});

/**
 * Leave a booking
 * POST /api/bookings/:id/leave
 */
export const leaveBooking = asyncHandler(async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id: bookingId } = req.params;
  const userId = req.user!.id;

  const booking = await bookingService.leaveBooking(userId, bookingId);

  logger.info('Player left booking', { bookingId, userId });

  sendSuccess(
    res,
    { booking },
    'Successfully left the booking',
    HTTP_STATUS.OK
  );
});

/**
 * Invite players to a booking
 * POST /api/bookings/:id/invite
 */
export const invitePlayers = asyncHandler(async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id: bookingId } = req.params;
  const userId = req.user!.id;
  const { userIds } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    throw new Error('userIds array is required');
  }

  const inviteData: InvitePlayersRequest = {
    bookingId,
    userIds
  };

  const booking = await bookingService.invitePlayers(userId, inviteData);

  logger.info('Players invited to booking', {
    bookingId,
    inviterId: userId,
    invitedCount: userIds.length
  });

  sendSuccess(
    res,
    { booking },
    'Invitations sent successfully',
    HTTP_STATUS.OK
  );
});

/**
 * Get user's bookings
 * GET /api/bookings/my
 */
export const getMyBookings = asyncHandler(async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userId = req.user!.id;
  const query = req.query as BookingSearchQuery;

  const bookings = await bookingService.getMyBookings(userId, query);

  logger.debug('User bookings retrieved', {
    userId,
    count: bookings.length,
    filters: query
  });

  sendSuccess(
    res,
    { bookings, count: bookings.length },
    'Bookings retrieved successfully',
    HTTP_STATUS.OK
  );
});

/**
 * Get public group matches
 * GET /api/matches/groups
 */
/**
 * Get public group matches with filtering and sorting
 * GET /api/matches/groups
 * Query params: date, courtId, futsalCourtId, minPlayers, maxPlayers, availableSlots, 
 *               sortBy (players|date|time|createdAt), sortOrder (asc|desc)
 */
export const getPublicGroupMatches = asyncHandler(async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const query = req.query as BookingSearchQuery;

  // Parse numeric query parameters
  if (query.minPlayers) query.minPlayers = Number(query.minPlayers);
  if (query.maxPlayers) query.maxPlayers = Number(query.maxPlayers);
  if (query.availableSlots) query.availableSlots = Number(query.availableSlots);
  if (query.page) query.page = Number(query.page);
  if (query.limit) query.limit = Number(query.limit);

  const result = await bookingService.getPublicGroupMatches(query);

  logger.debug('Public group matches retrieved', {
    count: result.groups.length,
    filters: query
  });

  sendSuccess(
    res,
    result,
    'Group matches retrieved successfully',
    HTTP_STATUS.OK
  );
});

/**
 * Get joinable bookings for solo players (sorted by available slots)
 * GET /api/bookings/joinable
 * Returns bookings that need more players, sorted by available slots
 */
export const getJoinableBookings = asyncHandler(async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const query = req.query as BookingSearchQuery;

  // Parse numeric query parameters
  if (query.minPlayers) query.minPlayers = Number(query.minPlayers);
  if (query.maxPlayers) query.maxPlayers = Number(query.maxPlayers);
  if (query.availableSlots) query.availableSlots = Number(query.availableSlots);
  if (query.page) query.page = Number(query.page);
  if (query.limit) query.limit = Number(query.limit);

  // Default to sorting by available slots (descending) for solo players
  if (!query.sortBy) {
    query.sortBy = 'players';
    query.sortOrder = 'desc';
  }

  const result = await bookingService.getJoinableBookings(query);

  logger.debug('Joinable bookings retrieved', {
    count: result.groups.length,
    filters: query
  });

  sendSuccess(
    res,
    result,
    'Joinable bookings retrieved successfully',
    HTTP_STATUS.OK
  );
});

/**
 * Join a group match
 * POST /api/matches/groups/:id/join
 */
export const joinGroupMatch = asyncHandler(async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id: groupId } = req.params;
  const userId = req.user!.id;

  const result = await bookingService.joinBooking(userId, groupId);

  logger.info('Player joined group match', {
    groupId,
    userId,
    autoConfirmed: result.autoConfirmed
  });

  sendSuccess(
    res,
    result,
    result.autoConfirmed 
      ? 'Group joined and booking auto-confirmed (group is now full)' 
      : 'Successfully joined the group',
    HTTP_STATUS.OK
  );
});

/**
 * Get booking by ID
 * GET /api/bookings/:id
 */
export const getBookingById = asyncHandler(async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id: bookingId } = req.params;

  const booking = await bookingService.getBookingWithDetails(bookingId);

  logger.debug('Booking details retrieved', { bookingId });

  sendSuccess(
    res,
    { booking },
    'Booking retrieved successfully',
    HTTP_STATUS.OK
  );
});

