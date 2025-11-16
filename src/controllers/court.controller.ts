import { Request, Response, NextFunction } from 'express';
import { CourtService } from '../services/court.service.js';
import { HTTP_STATUS, SUCCESS_MESSAGES, ERROR_CODES, ERROR_MESSAGES } from '../config/constants.js';
import { asyncHandler, ValidationError } from '../middleware/error.middleware.js';
import { CreateCourtRequest, UpdateCourtRequest } from '../types/court.types.js';
import logger from '../utils/logger.js';

/**
 * Standardized success response helper
 */
const sendSuccess = <T = any>(
  res: Response,
  data: T,
  message: string,
  statusCode: number = HTTP_STATUS.OK
): Response => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    meta: {
      timestamp: new Date().toISOString()
    }
  });
};

export class CourtController {
  private courtService: CourtService;

  constructor() {
    this.courtService = new CourtService();
  }

  // ==================== COURT OPERATIONS (Owner) ====================

  /**
   * Create a new court within a futsal venue
   * POST /api/courts/:futsalCourtId/courts
   * @access Owner
   */
  createCourt = asyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const courtData: CreateCourtRequest = req.body;
    const { futsalCourtId } = req.params;
    const ownerId = req.user!.id;

    const court = await this.courtService.createCourt(courtData, futsalCourtId, ownerId);

    logger.info('Court created successfully', {
      courtId: court.id,
      futsalCourtId,
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
   * Get all courts and futsal venues owned by the authenticated user
   * GET /api/courts/owner/my-courts
   * @access Owner
   */
  getOwnerCourts = asyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const ownerId = req.user!.id;

    const result = await this.courtService.getOwnerCourts(ownerId);

    sendSuccess(
      res,
      result,
      'Owner courts retrieved successfully',
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

  // ==================== FUTSAL COURT OPERATIONS (Admin) ====================

  /**
   * Get all futsal courts with optional filters
   * GET /api/admin/futsal-courts
   * @access Admin
   */
  getAllFutsalCourts = asyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const filter = req.query;

    const futsalCourts = await this.courtService.getAllFutsalCourts(filter);

    sendSuccess(
      res,
      { futsalCourts, count: futsalCourts.length },
      'Futsal courts retrieved successfully',
      HTTP_STATUS.OK
    );
  });

  /**
   * Verify a futsal court
   * PATCH /api/admin/futsal-courts/:futsalCourtId/verify
   * @access Admin
   */
  verifyFutsalCourt = asyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { futsalCourtId } = req.params;

    const futsalCourt = await this.courtService.verifyFutsalCourt(futsalCourtId);

    logger.info('Futsal court verified', {
      futsalCourtId,
      adminId: req.user!.id
    });

    sendSuccess(
      res,
      { futsalCourt },
      'Futsal court verified successfully',
      HTTP_STATUS.OK
    );
  });

  /**
   * Suspend a futsal court
   * PATCH /api/admin/futsal-courts/:futsalCourtId/suspend
   * @access Admin
   */
  suspendFutsalCourt = asyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { futsalCourtId } = req.params;

    const futsalCourt = await this.courtService.suspendFutsalCourt(futsalCourtId);

    logger.warn('Futsal court suspended', {
      futsalCourtId,
      adminId: req.user!.id
    });

    sendSuccess(
      res,
      { futsalCourt },
      'Futsal court suspended successfully',
      HTTP_STATUS.OK
    );
  });

  /**
   * Activate a futsal court
   * PATCH /api/admin/futsal-courts/:futsalCourtId/activate
   * @access Admin
   */
  activateFutsalCourt = asyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { futsalCourtId } = req.params;

    const futsalCourt = await this.courtService.activateFutsalCourt(futsalCourtId);

    logger.info('Futsal court activated', {
      futsalCourtId,
      adminId: req.user!.id
    });

    sendSuccess(
      res,
      { futsalCourt },
      'Futsal court activated successfully',
      HTTP_STATUS.OK
    );
  });

  // ==================== PUBLIC OPERATIONS ====================

  /**
   * Search futsal courts with filters
   * GET /api/public/futsal-courts/search
   * @access Public
   */
  searchFutsalCourts = asyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const query = req.query;

    const futsalCourts = await this.courtService.searchFutsalCourts(query);

    sendSuccess(
      res,
      { futsalCourts, count: futsalCourts.length },
      'Search completed successfully',
      HTTP_STATUS.OK
    );
  });

  /**
   * Get futsal court details by ID
   * GET /api/public/futsal-courts/:futsalCourtId
   * @access Public
   */
  getFutsalCourtById = asyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { futsalCourtId } = req.params;

    const futsalCourt = await this.courtService.getFutsalCourtById(futsalCourtId);

    sendSuccess(
      res,
      { futsalCourt },
      'Futsal court details retrieved successfully',
      HTTP_STATUS.OK
    );
  });

  /**
   * Get futsal court with all its courts
   * GET /api/public/futsal-courts/:futsalCourtId/courts
   * @access Public
   */
  getFutsalCourtWithCourts = asyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { futsalCourtId } = req.params;

    const result = await this.courtService.getFutsalCourtWithCourts(futsalCourtId);

    sendSuccess(
      res,
      result,
      'Futsal court and courts retrieved successfully',
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
    const query = req.query;

    const courts = await this.courtService.searchCourts(query);

    sendSuccess(
      res,
      { courts, count: courts.length },
      'Court search completed successfully',
      HTTP_STATUS.OK
    );
  });
}

// Export controller instance
export const courtController = new CourtController();