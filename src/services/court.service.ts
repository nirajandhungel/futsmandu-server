import { CourtRepository, FutsalCourtRepository } from '../repositories/court.repository.js';
import { 
  CreateCourtRequest, 
  UpdateCourtRequest, 
  Court, 
  FutsalCourt,
  CourtSearchQuery,
  FutsalCourtSearchQuery,
  CourtAvailability
} from '../types/court.types.js';
import { 
  NotFoundError, 
  ConflictError,
  AuthorizationError,
  BusinessLogicError,
  ValidationError
} from '../middleware/error.middleware.js';
import { ERROR_CODES, ERROR_MESSAGES } from '../config/constants.js';
import logger from '../utils/logger.js';

export class CourtService {
  private courtRepository: CourtRepository;
  private futsalCourtRepository: FutsalCourtRepository;

  constructor() {
    this.courtRepository = new CourtRepository();
    this.futsalCourtRepository = new FutsalCourtRepository();
  }

  // ==================== COURT OPERATIONS (Owner) ====================

  /**
   * Create a new court within a futsal venue
   * @throws {NotFoundError} If futsal court not found
   * @throws {AuthorizationError} If user is not the owner
   * @throws {ConflictError} If court number already exists
   */
  async createCourt(
    courtData: CreateCourtRequest, 
    futsalCourtId: string, 
    ownerId: string
  ): Promise<Court> {
    // Verify futsal court exists
    const futsalCourt = await this.futsalCourtRepository.findFutsalCourtById(futsalCourtId);
    
    if (!futsalCourt) {
      throw new NotFoundError(
        ERROR_MESSAGES[ERROR_CODES.COURT_NOT_FOUND],
        ERROR_CODES.COURT_NOT_FOUND,
        { futsalCourtId }
      );
    }

    // Verify ownership
    if (futsalCourt.ownerId !== ownerId) {
      throw new AuthorizationError(
        ERROR_MESSAGES[ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS],
        ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
        { 
          reason: 'You can only add courts to your own futsal venues',
          futsalCourtId,
          ownerId: futsalCourt.ownerId
        }
      );
    }

    // Check if court number already exists
    const courtNumberExists = await this.courtRepository.courtNumberExists(
      futsalCourtId, 
      courtData.courtNumber
    );

    if (courtNumberExists) {
      throw new ConflictError(
        ERROR_MESSAGES[ERROR_CODES.RESOURCE_ALREADY_EXISTS],
        ERROR_CODES.RESOURCE_ALREADY_EXISTS,
        {
          field: 'courtNumber',
          value: courtData.courtNumber,
          message: 'A court with this number already exists in this venue'
        }
      );
    }

    // Create the court
    const court = await this.courtRepository.createCourt({
      ...courtData,
      futsalCourtId
    });

    logger.info('Court created successfully', {
      courtId: court.id,
      futsalCourtId,
      ownerId,
      courtNumber: court.courtNumber
    });

    return court;
  }

  /**
   * Create a new futsal court (venue)
   * @throws {ConflictError} If futsal court name already exists for owner
   */
  async createFutsalCourt(
    futsalCourtData: any,
    ownerId: string
  ): Promise<FutsalCourt> {
    // Check if futsal court with same name already exists for this owner
    const exists = await this.futsalCourtRepository.futsalCourtExistsByName(
      futsalCourtData.name,
      ownerId
    );

    if (exists) {
      throw new ConflictError(
        ERROR_MESSAGES[ERROR_CODES.RESOURCE_ALREADY_EXISTS],
        ERROR_CODES.RESOURCE_ALREADY_EXISTS,
        {
          field: 'name',
          value: futsalCourtData.name,
          message: 'A futsal court with this name already exists'
        }
      );
    }

    // Create the futsal court
    const futsalCourt = await this.futsalCourtRepository.createFutsalCourt({
      ...futsalCourtData,
      ownerId,
      isVerified: false,
      isActive: true,
      rating: 0,
      totalReviews: 0
    });

    logger.info('Futsal court created successfully', {
      futsalCourtId: futsalCourt.id,
      ownerId,
      name: futsalCourt.name
    });

    return futsalCourt;
  }

  /**
   * Get all courts and futsal venues owned by a user
   */
  async getOwnerCourts(ownerId: string): Promise<{ 
    futsalCourts: FutsalCourt[], 
    courts: Court[] 
  }> {
    const futsalCourts = await this.futsalCourtRepository.findFutsalCourtsByOwnerId(ownerId);
    
    const courts: Court[] = [];
    
    for (const futsalCourt of futsalCourts) {
      const venueCourts = await this.courtRepository.findCourtsByFutsalCourtId(futsalCourt.id!);
      courts.push(...venueCourts);
    }

    logger.debug('Owner courts retrieved', {
      ownerId,
      futsalCourtsCount: futsalCourts.length,
      courtsCount: courts.length
    });

    return { futsalCourts, courts };
  }

  /**
   * Update a court
   * @throws {NotFoundError} If court not found
   * @throws {AuthorizationError} If user is not the owner
   * @throws {ConflictError} If updating to existing court number
   */
  async updateCourt(
    courtId: string, 
    updateData: UpdateCourtRequest, 
    ownerId: string
  ): Promise<Court> {
    // Find the court
    const court = await this.courtRepository.findCourtById(courtId);
    
    if (!court) {
      throw new NotFoundError(
        ERROR_MESSAGES[ERROR_CODES.COURT_NOT_FOUND],
        ERROR_CODES.COURT_NOT_FOUND,
        { courtId }
      );
    }

    // Verify ownership through futsal court
    const futsalCourt = await this.futsalCourtRepository.findFutsalCourtById(
      court.futsalCourtId
    );

    if (!futsalCourt || futsalCourt.ownerId !== ownerId) {
      throw new AuthorizationError(
        ERROR_MESSAGES[ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS],
        ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
        { 
          reason: 'You can only update your own courts',
          courtId
        }
      );
    }

    // If updating court number, check for conflicts
    if (updateData.courtNumber && updateData.courtNumber !== court.courtNumber) {
      const courtNumberExists = await this.courtRepository.courtNumberExists(
        court.futsalCourtId,
        updateData.courtNumber,
        courtId
      );

      if (courtNumberExists) {
        throw new ConflictError(
          ERROR_MESSAGES[ERROR_CODES.RESOURCE_ALREADY_EXISTS],
          ERROR_CODES.RESOURCE_ALREADY_EXISTS,
          {
            field: 'courtNumber',
            value: updateData.courtNumber,
            message: 'A court with this number already exists in this venue'
          }
        );
      }
    }

    // Update the court
    const updatedCourt = await this.courtRepository.updateCourtById(courtId, updateData);

    if (!updatedCourt) {
      throw new NotFoundError(
        ERROR_MESSAGES[ERROR_CODES.COURT_NOT_FOUND],
        ERROR_CODES.COURT_NOT_FOUND,
        { courtId }
      );
    }

    logger.info('Court updated successfully', {
      courtId,
      ownerId,
      updatedFields: Object.keys(updateData)
    });

    return updatedCourt;
  }

  /**
   * Delete a court (soft delete by setting isActive to false)
   */
  async deleteCourt(courtId: string, ownerId: string): Promise<void> {
    const court = await this.courtRepository.findCourtById(courtId);
    
    if (!court) {
      throw new NotFoundError(
        ERROR_MESSAGES[ERROR_CODES.COURT_NOT_FOUND],
        ERROR_CODES.COURT_NOT_FOUND,
        { courtId }
      );
    }

    // Verify ownership
    const futsalCourt = await this.futsalCourtRepository.findFutsalCourtById(
      court.futsalCourtId
    );

    if (!futsalCourt || futsalCourt.ownerId !== ownerId) {
      throw new AuthorizationError(
        ERROR_MESSAGES[ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS],
        ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS
      );
    }

    // Soft delete
    await this.courtRepository.updateCourtById(courtId, { isActive: false ,isAvailable:false});

    logger.info('Court deleted successfully', { courtId, ownerId });
  }

  // ==================== FUTSAL COURT OPERATIONS (Admin) ====================

  /**
   * Get all futsal courts (Admin only)
   */
  async getAllFutsalCourts(filter: any = {}): Promise<FutsalCourt[]> {
    return await this.futsalCourtRepository.findAllFutsalCourts(filter);
  }

  /**
   * Verify a futsal court (Admin only)
   * @throws {NotFoundError} If futsal court not found
   */
  async verifyFutsalCourt(futsalCourtId: string): Promise<FutsalCourt> {
    const futsalCourt = await this.futsalCourtRepository.verifyFutsalCourt(futsalCourtId);
    
    if (!futsalCourt) {
      throw new NotFoundError(
        ERROR_MESSAGES[ERROR_CODES.COURT_NOT_FOUND],
        ERROR_CODES.COURT_NOT_FOUND,
        { futsalCourtId }
      );
    }

    logger.info('Futsal court verified', { futsalCourtId });

    return futsalCourt;
  }

  /**
   * Suspend a futsal court (Admin only)
   * @throws {NotFoundError} If futsal court not found
   */
  async suspendFutsalCourt(futsalCourtId: string): Promise<FutsalCourt> {
    const futsalCourt = await this.futsalCourtRepository.suspendFutsalCourt(futsalCourtId);
    
    if (!futsalCourt) {
      throw new NotFoundError(
        ERROR_MESSAGES[ERROR_CODES.COURT_NOT_FOUND],
        ERROR_CODES.COURT_NOT_FOUND,
        { futsalCourtId }
      );
    }

    logger.warn('Futsal court suspended', { futsalCourtId });

    return futsalCourt;
  }

  /**
   * Activate a futsal court (Admin only)
   */
  async activateFutsalCourt(futsalCourtId: string): Promise<FutsalCourt> {
    const futsalCourt = await this.futsalCourtRepository.activateFutsalCourt(futsalCourtId);
    
    if (!futsalCourt) {
      throw new NotFoundError(
        ERROR_MESSAGES[ERROR_CODES.COURT_NOT_FOUND],
        ERROR_CODES.COURT_NOT_FOUND,
        { futsalCourtId }
      );
    }

    logger.info('Futsal court activated', { futsalCourtId });

    return futsalCourt;
  }

  // ==================== PUBLIC OPERATIONS ====================

  /**
   * Search futsal courts with filters (Public)
   */
  async searchFutsalCourts(query: FutsalCourtSearchQuery): Promise<FutsalCourt[]> {
    return await this.futsalCourtRepository.searchFutsalCourts(query);
  }

  /**
   * Get futsal court details by ID (Public)
   * @throws {NotFoundError} If court not found or not public
   */
  async getFutsalCourtById(futsalCourtId: string): Promise<FutsalCourt> {
    const futsalCourt = await this.futsalCourtRepository.findFutsalCourtById(futsalCourtId);

    if (!futsalCourt || !futsalCourt.isActive || !futsalCourt.isVerified) {
      throw new NotFoundError(
        ERROR_MESSAGES[ERROR_CODES.COURT_NOT_FOUND],
        ERROR_CODES.COURT_NOT_FOUND,
        { 
          futsalCourtId,
          reason: 'Court not found or not available for public viewing'
        }
      );
    }

    return futsalCourt;
  }

  /**
   * Get futsal court with all its courts (Public)
   */
  async getFutsalCourtWithCourts(futsalCourtId: string): Promise<{ 
    futsalCourt: FutsalCourt, 
    courts: Court[] 
  }> {
    const futsalCourt = await this.getFutsalCourtById(futsalCourtId);
    const courts = await this.courtRepository.findActiveCourtsByFutsalCourtId(futsalCourtId);

    return { futsalCourt, courts };
  }

  /**
   * Get court details by ID (Public)
   * @throws {NotFoundError} If court not found or not active
   */
  async getCourtById(courtId: string): Promise<Court> {
    const court = await this.courtRepository.findCourtById(courtId);

    if (!court || !court.isActive) {
      throw new NotFoundError(
        ERROR_MESSAGES[ERROR_CODES.COURT_NOT_FOUND],
        ERROR_CODES.COURT_NOT_FOUND,
        { courtId }
      );
    }

    return court;
  }

  /**
   * Get court availability for a specific date (Public)
   * @throws {NotFoundError} If court not found
   * @throws {ValidationError} If date is invalid
   */
  async getCourtAvailability(courtId: string, date: string): Promise<CourtAvailability> {
    const court = await this.courtRepository.findCourtById(courtId);

    if (!court || !court.isActive) {
      throw new NotFoundError(
        ERROR_MESSAGES[ERROR_CODES.COURT_NOT_FOUND],
        ERROR_CODES.COURT_NOT_FOUND,
        { courtId }
      );
    }

    // Validate date format
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      throw new ValidationError(
        ERROR_MESSAGES[ERROR_CODES.VALIDATION_INVALID_FORMAT],
        {
          field: 'date',
          value: date,
          expectedFormat: 'YYYY-MM-DD'
        }
      );
    }

    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (dateObj < today) {
      throw new BusinessLogicError(
        'Cannot check availability for past dates',
        ERROR_CODES.BOOKING_INVALID_TIME,
        { date }
      );
    }

    // Generate time slots
    const availableSlots = this.generateTimeSlots(court.openingTime, court.closingTime);

    // TODO: Check actual bookings and filter out booked slots
    // This would require BookingRepository to check existing bookings

    return {
      courtId: court.id!,
      courtName: court.name,
      date,
      availableSlots,
      hourlyRate: court.hourlyRate,
      peakHourRate: court.peakHourRate
    };
  }

  /**
   * Generate time slots between opening and closing time
   * @private
   */
  private generateTimeSlots(openingTime: string, closingTime: string): string[] {
    const slots: string[] = [];
    
    const [openHour] = openingTime.split(':').map(Number);
    const [closeHour] = closingTime.split(':').map(Number);

    for (let hour = openHour; hour < closeHour; hour++) {
      const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
      slots.push(timeSlot);
    }

    return slots;
  }

  /**
   * Search courts with filters
   */
  async searchCourts(query: CourtSearchQuery): Promise<Court[]> {
    return await this.courtRepository.searchCourts(query);
  }
}