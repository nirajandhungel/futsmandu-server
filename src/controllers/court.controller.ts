import { Request, Response, NextFunction } from 'express';
import { CourtService } from '../services/court.service.js';
import { HTTP_STATUS, SUCCESS_MESSAGES, ERROR_CODES, ERROR_MESSAGES } from '../config/constants.js';
import { asyncHandler, ValidationError } from '../middleware/error.middleware.js';
import { CreateCourtRequest, UpdateCourtRequest, CourtSearchQuery } from '../types/court.types.js';
import logger from '../utils/logger.js';
import { sendSuccess } from '../utils/responseHandler.js';

export class CourtController {
  private courtService: CourtService;

  constructor() {
    this.courtService = new CourtService();
  }

  // ==================== COURT OPERATIONS (Owner) ====================

  /**
   * Add a new court to an existing venue
   * POST /api/venues/:venueId/courts
   * @access Owner
   */
  addCourtToVenue = asyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const courtData: CreateCourtRequest = req.body;
    const { venueId } = req.params;
    const ownerId = req.user!.id;

    const court = await this.courtService.addCourtToVenue(courtData, venueId, ownerId);

    logger.info('Court added to venue successfully', {
      courtId: court.id,
      venueId,
      ownerId,
      courtNumber: court.courtNumber
    });

    sendSuccess(
      res,
      { court },
      SUCCESS_MESSAGES.OPERATION_SUCCESS,
      HTTP_STATUS.CREATED
    );
  });

  /**
   * Get all venues and courts owned by the authenticated user
   * GET /api/courts/owner/my-venues
   * @access Owner
   */
  getOwnerVenues = asyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const ownerId = req.user!.id;

    const result = await this.courtService.getOwnerVenues(ownerId);

    sendSuccess(
      res,
      result,
      'Owner venues and courts retrieved successfully',
      HTTP_STATUS.OK
    );
  });

  /**
   * Update a court
   * PUT /api/courts/:courtId
   * @access Owner
   */
  updateCourt = asyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const updateData: UpdateCourtRequest = req.body;
    const { courtId } = req.params;
    const ownerId = req.user!.id;

    const updatedCourt = await this.courtService.updateCourt(courtId, updateData, ownerId);

    logger.info('Court updated successfully', {
      courtId,
      ownerId,
      updatedFields: Object.keys(updateData)
    });

    sendSuccess(
      res,
      { court: updatedCourt },
      SUCCESS_MESSAGES.DATA_SAVED,
      HTTP_STATUS.OK
    );
  });

  /**
   * Delete a court (soft delete)
   * DELETE /api/courts/:courtId
   * @access Owner
   */
  deleteCourt = asyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { courtId } = req.params;
    const ownerId = req.user!.id;

    await this.courtService.deleteCourt(courtId, ownerId);

    logger.info('Court deleted successfully', { courtId, ownerId });

    sendSuccess(
      res,
      null,
      SUCCESS_MESSAGES.DATA_DELETED,
      HTTP_STATUS.OK
    );
  });

  // ==================== VENUE OPERATIONS (Admin) ====================

  /**
   * Get all venues with optional filters
   * GET /api/admin/venues
   * @access Admin
   */
  getAllVenues = asyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const filter = req.query;

    const venues = await this.courtService.getAllVenues(filter);

    sendSuccess(
      res,
      { venues, count: venues.length },
      'Venues retrieved successfully',
      HTTP_STATUS.OK
    );
  });

  /**
   * Verify a venue
   * PATCH /api/admin/venues/:venueId/verify
   * @access Admin
   */
  verifyVenue = asyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { venueId } = req.params;

    const venue = await this.courtService.verifyVenue(venueId);

    logger.info('Venue verified', {
      venueId,
      adminId: req.user!.id
    });

    sendSuccess(
      res,
      { venue },
      'Venue verified successfully',
      HTTP_STATUS.OK
    );
  });

  /**
   * Suspend a venue
   * PATCH /api/admin/venues/:venueId/suspend
   * @access Admin
   */
  suspendVenue = asyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { venueId } = req.params;

    const venue = await this.courtService.suspendVenue(venueId);

    logger.warn('Venue suspended', {
      venueId,
      adminId: req.user!.id
    });

    sendSuccess(
      res,
      { venue },
      'Venue suspended successfully',
      HTTP_STATUS.OK
    );
  });

  /**
   * Activate a venue
   * PATCH /api/admin/venues/:venueId/activate
   * @access Admin
   */
  activateVenue = asyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { venueId } = req.params;

    const venue = await this.courtService.activateVenue(venueId);

    logger.info('Venue activated', {
      venueId,
      adminId: req.user!.id
    });

    sendSuccess(
      res,
      { venue },
      'Venue activated successfully',
      HTTP_STATUS.OK
    );
  });

  // ==================== PUBLIC OPERATIONS ====================

  /**
   * Search venues with filters
   * GET /api/public/venues/search
   * @access Public
   */
  searchVenues = asyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const query = req.query as any;

    const venues = await this.courtService.searchVenues(query);

    sendSuccess(
      res,
      { venues, count: venues.length },
      'Search completed successfully',
      HTTP_STATUS.OK
    );
  });

  /**
   * Get venue details by ID
   * GET /api/public/venues/:venueId
   * @access Public
   */
  getVenueById = asyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { venueId } = req.params;

    const venue = await this.courtService.getVenueById(venueId);

    sendSuccess(
      res,
      { venue },
      'Venue details retrieved successfully',
      HTTP_STATUS.OK
    );
  });

  /**
   * Get venue with all its courts
   * GET /api/public/venues/:venueId/courts
   * @access Public
   */
  getVenueWithCourts = asyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { venueId } = req.params;

    const result = await this.courtService.getVenueWithCourts(venueId);

    sendSuccess(
      res,
      result,
      'Venue and courts retrieved successfully',
      HTTP_STATUS.OK
    );
  });

  /**
   * Get single court details by ID
   * GET /api/public/courts/:courtId
   * @access Public
   */
  getCourtById = asyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { courtId } = req.params;

    const court = await this.courtService.getCourtById(courtId);

    sendSuccess(
      res,
      { court },
      'Court details retrieved successfully',
      HTTP_STATUS.OK
    );
  });
  
  getAllCourts= asyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    // const { courtId } = req.params;

    const court = await this.courtService.getAllCourts();

    sendSuccess(
      res,
      { court },
      'Court details retrieved successfully',
      HTTP_STATUS.OK
    );
  });

  /**
   * Get court availability for a specific date
   * GET /api/public/courts/:courtId/availability?date=YYYY-MM-DD
   * @access Public
   */
  getCourtAvailability = asyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { courtId } = req.params;
    const { date } = req.query;

    // Validate date parameter
    if (!date || typeof date !== 'string') {
      throw new ValidationError(
        ERROR_MESSAGES[ERROR_CODES.VALIDATION_REQUIRED_FIELD],
        {
          field: 'date',
          message: 'Date query parameter is required (format: YYYY-MM-DD)'
        }
      );
    }

    const availability = await this.courtService.getCourtAvailability(courtId, date);

    sendSuccess(
      res,
      availability,
      'Court availability retrieved successfully',
      HTTP_STATUS.OK
    );
  });

  /**
   * Search courts with filters
   * GET /api/public/courts/search
   * @access Public
   */
  searchCourts = asyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const query = req.query as CourtSearchQuery;

    const courts = await this.courtService.searchCourts(query);

    sendSuccess(
      res,
      { courts, count: courts.length },
      'Court search completed successfully',
      HTTP_STATUS.OK
    );
  });

  /**
   * Get all public courts (active & available)
   * GET /api/public/courts
   * @access Public
   */
  getPublicCourts = asyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const query = req.query as CourtSearchQuery;

    const result = await this.courtService.getPublicCourts(query);

    sendSuccess(
      res,
      result,
      'Courts retrieved successfully',
      HTTP_STATUS.OK
    );
  });
}

// Export controller instance
export const courtController = new CourtController();