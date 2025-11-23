import type { Request, Response } from 'express';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../config/constants.js';
import { createResponse } from '../utils/helpers.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { OwnerService } from '../services/owner.service.js';
import { BookingService } from '../services/booking.service.js';
import type { OwnerDocumentsUpload } from '../types/user.types.js';
import { CreateFutsalCourtRequest } from '../types/court.types.js';
import logger from '../utils/logger.js';

const ownerService = new OwnerService();
const bookingService = new BookingService();

export const activateOwnerMode = asyncHandler(async (req: Request, res: Response) => {
    const result = await ownerService.activateOwnerMode(
        req.user!.id,
        {
            panNumber: req.body.panNumber,
            address: req.body.address,
            additionalKyc: req.body.additionalKyc,
        },
        (req.files ?? {}) as OwnerDocumentsUpload
    );

    res.status(HTTP_STATUS.OK).json(
        createResponse(
            true,
            result,
            'Owner mode enabled successfully',
            HTTP_STATUS.OK
        )
    );
});

export const deactivateOwnerMode = asyncHandler(async (req: Request, res: Response) => {
    const result = await ownerService.deactivateOwnerMode(req.user!.id);

    res.status(HTTP_STATUS.OK).json(
        createResponse(
            true,
            result,
            'Owner mode disabled. You are back in player mode.',
            HTTP_STATUS.OK
        )
    );
});

export const getOwnerProfile = asyncHandler(async (req: Request, res: Response) => {
    const profile = await ownerService.getOwnerProfile(req.user!.id);

    res.status(HTTP_STATUS.OK).json(
        createResponse(
            true,
            profile,
            'Owner profile fetched successfully',
            HTTP_STATUS.OK
        )
    );
});

/**
 * Create a new futsal court (venue)
 * POST /api/owner/courts
 */
export const createFutsalCourt = asyncHandler(async (req: Request, res: Response) => {
    const futsalCourtData: CreateFutsalCourtRequest = req.body;
    const userId = req.user!.id;
    
    // Get uploaded images from multer
    const images = req.files as Express.Multer.File[] | undefined;

    const futsalCourt = await ownerService.createFutsalCourt(
        userId, 
        futsalCourtData,
        images
    );

    logger.info('Futsal court created', {
        futsalCourtId: futsalCourt.id,
        ownerId: userId,
        imageCount: images?.length || 0
    });

    res.status(HTTP_STATUS.CREATED).json(
        createResponse(
            true,
            { futsalCourt },
            'Futsal court created successfully',
            HTTP_STATUS.CREATED
        )
    );
});

/**
 * Get owner dashboard analytics
 * GET /api/owner/dashboard
 */
export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const analytics = await ownerService.getDashboardAnalytics(userId);

    res.status(HTTP_STATUS.OK).json(
        createResponse(
            true,
            analytics,
            'Dashboard analytics retrieved successfully',
            HTTP_STATUS.OK
        )
    );
});

/**
 * Approve a booking
 * PATCH /api/owner/bookings/:id/approve
 */
export const approveBooking = asyncHandler(async (req: Request, res: Response) => {
    const { id: bookingId } = req.params;
    const ownerId = req.user!.id;

    const booking = await bookingService.approveBooking(ownerId, bookingId);

    logger.info('Booking approved by owner', { bookingId, ownerId });

    res.status(HTTP_STATUS.OK).json(
        createResponse(
            true,
            { booking },
            'Booking approved successfully',
            HTTP_STATUS.OK
        )
    );
});

/**
 * Reject a booking
 * PATCH /api/owner/bookings/:id/reject
 */
export const rejectBooking = asyncHandler(async (req: Request, res: Response) => {
    const { id: bookingId } = req.params;
    const ownerId = req.user!.id;
    const { reason } = req.body;

    const booking = await bookingService.rejectBooking(ownerId, bookingId, reason);

    logger.info('Booking rejected by owner', { bookingId, ownerId, reason });

    res.status(HTTP_STATUS.OK).json(
        createResponse(
            true,
            { booking },
            'Booking rejected successfully',
            HTTP_STATUS.OK
        )
    );
});

