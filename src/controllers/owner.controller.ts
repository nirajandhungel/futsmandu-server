import type { Request, Response } from 'express';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../config/constants.js';
import { createResponse, parseFormData } from '../utils/helpers.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { OwnerService } from '../services/owner.service.js';
import { BookingService } from '../services/booking.service.js';
import type { OwnerDocumentsUpload } from '../types/user.types.js';
import { CreateFutsalVenueRequest } from '../types/court.types.js';
import logger from '../utils/logger.js';
import { ValidationError } from '../middleware/error.middleware.js';

const ownerService = new OwnerService();
const bookingService = new BookingService();

export const activateOwnerMode = asyncHandler(async (req: Request, res: Response) => {
    // Parse additionalKyc if it's a string

    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    // Parse additionalKyc if it's a string
    let additionalKyc = undefined;
    if (req.body.additionalKyc && typeof req.body.additionalKyc === 'string') {
        try {
            additionalKyc = JSON.parse(req.body.additionalKyc);
        } catch (error) {
            throw new ValidationError('Invalid additionalKyc JSON format');
        }
    }

    const result = await ownerService.activateOwnerMode(
        req.user!.id,
        {
            panNumber: req.body.panNumber,
            address: req.body.address,
            additionalKyc: additionalKyc,
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
// use-player-mode
export const usePlayerMode = asyncHandler(async (req: Request, res: Response) => {
    const result = await ownerService.usePlayerMode(req.user!.id);

    res.status(HTTP_STATUS.OK).json(
        createResponse(
            true,
            result,
            'Owner mode disabled. You are back in player mode.',
            HTTP_STATUS.OK
        )
    );
});
// use owner-mode
export const useOwnerMode = asyncHandler(async (req: Request, res: Response) => {
    const result = await ownerService.useOwnerMode(req.user!.id);

    res.status(HTTP_STATUS.OK).json(
        createResponse(
            true,
            result,
            'Player mode disabled. You are back in owner mode.',
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
 * Create a new venue with courts (at least one 5v5 or 6v6 court required)
 * POST /api/owner/venues
 * Accepts FormData with nested court structure
 */
export const createVenue = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    logger.info('📍 Received venue creation request', {
        userId,
        bodyKeys: Object.keys(req.body),
        filesCount: req.files ? (Array.isArray(req.files) ? req.files.length : Object.keys(req.files).length) : 0
    });

    // Parse FormData body into structured object
    const parsedBody = parseFormData(req.body);

    logger.debug('📍 Parsed FormData body', {
        parsedKeys: Object.keys(parsedBody),
        courtsCount: parsedBody.courts?.length || 0,
        hasAmenities: !!parsedBody.amenities
    });

    // Helper to parse amenities (can be string, array, or comma-separated string)
    const parseAmenities = (amenities: any): string[] => {
        if (!amenities) return [];
        if (Array.isArray(amenities)) return amenities;
        if (typeof amenities === 'string') {
            // Handle comma-separated string
            return amenities.split(',').map(a => a.trim()).filter(a => a.length > 0);
        }
        return [];
    };

    // Extract venue data
    const venueData: CreateFutsalVenueRequest = {
        name: parsedBody.name,
        description: parsedBody.description,
        location: parsedBody.location,
        contact: parsedBody.contact,
        amenities: parseAmenities(parsedBody.amenities),
        openingHours: parsedBody.openingHours,
        courts: parsedBody.courts || []
    };

    logger.debug('📍 Venue data extracted', {
        venueName: venueData.name,
        amenitiesCount: venueData.amenities?.length || 0,
        courtsCount: venueData.courts.length
    });

    // Parse amenities for each court as well
    if (venueData.courts && Array.isArray(venueData.courts)) {
        venueData.courts = venueData.courts.map((court, index) => {
            const parsedCourt = {
                ...court,
                amenities: parseAmenities(court.amenities)
            };

            logger.debug('📍 Court data parsed', {
                courtIndex: index,
                courtNumber: parsedCourt.courtNumber,
                name: parsedCourt.name,
                size: parsedCourt.size,
                hourlyRate: parsedCourt.hourlyRate,
                amenitiesCount: parsedCourt.amenities?.length || 0
            });

            return parsedCourt;
        });
    }

    logger.info('📍 Venue data prepared for service', {
        venueName: venueData.name,
        courtsCount: venueData.courts.length,
        courts: venueData.courts.map(c => ({
            courtNumber: c.courtNumber,
            name: c.name,
            size: c.size,
            hourlyRate: c.hourlyRate
        }))
    });

    // Handle files from multer
    const files = req.files as Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] } | undefined;

    // Separate venue images and court images
    let venueImages: Express.Multer.File[] = [];
    const courtImagesMap: { [courtIndex: number]: Express.Multer.File[] } = {};

    if (files) {
        if (Array.isArray(files)) {
            // If files is an array, all are venue images (legacy support)
            venueImages = files;
        } else {
            // Handle structured files object
            if (files['venueImages']) {
                venueImages = Array.isArray(files['venueImages']) ? files['venueImages'] : [files['venueImages']];
            }

            // Extract court images (courtImages[0], courtImages[1], etc.)
            for (const [fieldname, fileArray] of Object.entries(files)) {
                const courtImageMatch = fieldname.match(/^courtImages\[(\d+)\]$/);
                if (courtImageMatch) {
                    const courtIndex = parseInt(courtImageMatch[1], 10);
                    courtImagesMap[courtIndex] = Array.isArray(fileArray) ? fileArray : [fileArray];
                }
            }
        }
    }

    const venue = await ownerService.createVenue(
        userId,
        venueData,
        venueImages,
        courtImagesMap
    );

    logger.info('Venue created with courts', {
        venueId: venue.id,
        ownerId: userId,
        courtCount: venue.courts?.length || 0,
        venueImageCount: venueImages.length,
        courtImageCount: Object.keys(courtImagesMap).length
    });

    res.status(HTTP_STATUS.CREATED).json(
        createResponse(
            true,
            { venue },
            'Venue created successfully with courts',
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
 * Get owner dashboard analytics
 * GET /api/owner/dashboard
 */
export const getOwnerVenues = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const analytics = await ownerService.getDashboardAnalytics(userId);
    const venues = await ownerService.getOwnerVenues(userId);

    res.status(HTTP_STATUS.OK).json(
        createResponse(
            true,
            venues,
            'Owner Venues retrieved successfully',
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


//   complete a booking
//  PATCH /api/owner/bookings/:id/complete
//  



export const completeBooking = asyncHandler(async (req: Request, res: Response) => {
    const { id: bookingId } = req.params;
    const ownerId = req.user!.id;

    const booking = await bookingService.completeBooking(ownerId, bookingId);

    logger.info('Booking completed  by owner', { bookingId, ownerId });

    res.status(HTTP_STATUS.OK).json(
        createResponse(
            true,
            { booking },
            'Booking completed successfully',
            HTTP_STATUS.OK
        )
    );
});

