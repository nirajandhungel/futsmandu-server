import { Request, Response, NextFunction } from 'express';
import { BookingService } from '../services/booking.service.js';
import { HTTP_STATUS, SUCCESS_MESSAGES, ERROR_CODES, ERROR_MESSAGES } from '../config/constants.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { createResponse } from '../utils/helpers.js';
import {
  CreateBookingRequest,
  JoinBookingRequest,
  InvitePlayersRequest
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
    userId
  });

  res.status(HTTP_STATUS.CREATED).json(
    createResponse(
      true,
      { booking },
      SUCCESS_MESSAGES.BOOKING_CREATED,
      HTTP_STATUS.CREATED
    )
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
    autoConfirmed: result.autoConfirmed
  });

  res.status(HTTP_STATUS.OK).json(
    createResponse(
      true,
      result,
      result.autoConfirmed 
        ? 'Booking joined and auto-confirmed (full)' 
        : SUCCESS_MESSAGES.BOOKING_JOINED,
      HTTP_STATUS.OK
    )
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

  res.status(HTTP_STATUS.OK).json(
    createResponse(
      true,
      { booking },
      'Successfully left the booking',
      HTTP_STATUS.OK
    )
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

  res.status(HTTP_STATUS.OK).json(
    createResponse(
      true,
      { booking },
      'Invitations sent successfully',
      HTTP_STATUS.OK
    )
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
  const query = req.query;

  const bookings = await bookingService.getMyBookings(userId, query as any);

  res.status(HTTP_STATUS.OK).json(
    createResponse(
      true,
      { bookings, count: bookings.length },
      'Bookings retrieved successfully',
      HTTP_STATUS.OK
    )
  );
});

/**
 * Get public group matches
 * GET /api/matches/groups
 */
export const getPublicGroupMatches = asyncHandler(async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const query = req.query;

  const result = await bookingService.getPublicGroupMatches(query as any);

  res.status(HTTP_STATUS.OK).json(
    createResponse(
      true,
      result,
      'Group matches retrieved successfully',
      HTTP_STATUS.OK
    )
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

  res.status(HTTP_STATUS.OK).json(
    createResponse(
      true,
      result,
      result.autoConfirmed 
        ? 'Group joined and booking auto-confirmed (full)' 
        : 'Successfully joined the group',
      HTTP_STATUS.OK
    )
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

  res.status(HTTP_STATUS.OK).json(
    createResponse(
      true,
      { booking },
      'Booking retrieved successfully',
      HTTP_STATUS.OK
    )
  );
});

