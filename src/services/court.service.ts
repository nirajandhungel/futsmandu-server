import mongoose from 'mongoose';
import { CourtRepository, VenueRepository } from '../repositories/court.repository.js';
import { 
  CreateCourtRequest, 
  UpdateCourtRequest, 
  Court, 
  FutsalVenue,
  CreateFutsalVenueRequest,
  CourtSearchQuery,
  VenueSearchQuery,
  CourtAvailability,
  OwnerVenuesResponse,
  FutsalVenueWithCourts
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
  private venueRepository: VenueRepository;

  constructor() {
    this.courtRepository = new CourtRepository();
    this.venueRepository = new VenueRepository();
  }

  // ==================== VENUE + COURT OPERATIONS (Owner) ====================

  /**
   * Create a new venue with at least one court (5v5 or 6v6)
   * Courts are created in the same transaction
   * @throws {ValidationError} If no courts provided or no 5v5/6v6 court
   * @throws {ConflictError} If venue name already exists for owner
   */
  async createVenueWithCourts(
    venueData: CreateFutsalVenueRequest,
    ownerId: string
  ): Promise<FutsalVenueWithCourts> {
    // Validate: At least one court required
    if (!venueData.courts || venueData.courts.length === 0) {
      throw new ValidationError(
        'At least one court (5v5 or 6v6) is required when creating a venue',
        {
          field: 'courts',
          message: 'A venue must have at least one court with size 5v5 or 6v6'
        }
      );
    }

    // Validate: At least one court must be 5v5 or 6v6
    const hasValidCourt = venueData.courts.some(court => 
      court.size === '5v5' || court.size === '6v6'
    );

    if (!hasValidCourt) {
      throw new ValidationError(
        'At least one court must be 5v5 or 6v6 size',
        {
          field: 'courts',
          message: 'A venue must have at least one court with size 5v5 or 6v6'
        }
      );
    }

    // Check if venue name already exists for this owner
    const exists = await this.venueRepository.venueExistsByName(
      venueData.name,
      ownerId
    );

    if (exists) {
      throw new ConflictError(
        ERROR_MESSAGES[ERROR_CODES.RESOURCE_ALREADY_EXISTS],
        ERROR_CODES.RESOURCE_ALREADY_EXISTS,
        {
          field: 'name',
          value: venueData.name,
          message: 'A venue with this name already exists'
        }
      );
    }

    // Validate court numbers are unique
    const courtNumbers = venueData.courts.map(c => c.courtNumber);
    const uniqueCourtNumbers = new Set(courtNumbers);
    if (courtNumbers.length !== uniqueCourtNumbers.size) {
      throw new ValidationError(
        'Court numbers must be unique within the venue',
        {
          field: 'courts',
          message: 'Each court must have a unique court number'
        }
      );
    }

    // Start transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      logger.info('📍 Starting venue creation transaction', {
        ownerId,
        courtCount: venueData.courts?.length || 0,
        venueName: venueData.name
      });

      // Create venue with session
      const venue = await this.venueRepository.createVenue({
        ...venueData,
        courts: undefined, // Remove courts from venue data
        ownerId,
        isVerified: false,
        isActive: true,
        rating: 0,
        totalReviews: 0
      }, session);

      logger.info('📍 Venue created successfully', {
        venueId: venue.id,
        venueName: venue.name
      });

      // Validate courts data before creating
      if (!venueData.courts || venueData.courts.length === 0) {
        throw new ValidationError(
          'At least one court is required when creating a venue',
          {
            field: 'courts',
            message: 'A venue must have at least one court'
          }
        );
      }

      // Create all courts for the venue
      // Note: Smart defaults should already be applied in owner service
      // But we ensure required fields are present here as a safety check
      const courtsData = venueData.courts.map((court, index) => {
        // Validate required fields
        if (!court.courtNumber || !court.name || !court.size || !court.hourlyRate) {
          throw new ValidationError(
            `Court at index ${index} missing required fields: courtNumber, name, size, and hourlyRate are required`,
            {
              field: `courts[${index}]`,
              message: 'Each court must have courtNumber, name, size, and hourlyRate',
              courtData: court
            }
          );
        }

        // Ensure all fields have values (defaults should be applied in owner service)
        const courtData = {
          ...court,
          venueId: venue.id!,
          maxPlayers: court.maxPlayers ?? 10,
          openingTime: court.openingTime ?? '06:00',
          closingTime: court.closingTime ?? '22:00',
          peakHourRate: court.peakHourRate ?? Math.round(court.hourlyRate * 1.25),
          isActive: court.isActive ?? true,
          isAvailable: court.isAvailable ?? true,
          amenities: Array.isArray(court.amenities) ? court.amenities : (court.amenities ? [court.amenities] : [])
        };

        logger.debug('📍 Court data prepared', {
          courtIndex: index,
          courtNumber: courtData.courtNumber,
          name: courtData.name,
          size: courtData.size,
          venueId: courtData.venueId
        });

        return courtData;
      });

      logger.info('📍 Creating courts in database', {
        courtCount: courtsData.length,
        venueId: venue.id
      });

      // Create courts with session
      const courts = await this.courtRepository.createCourts(courtsData, session);

      logger.info('📍 Courts created successfully', {
        courtCount: courts.length,
        courtIds: courts.map(c => c.id),
        venueId: venue.id
      });

      // Commit transaction
      await session.commitTransaction();

      logger.info('📍 Transaction committed successfully', {
        venueId: venue.id,
        ownerId,
        courtCount: courts.length,
        venueName: venue.name
      });

      return {
        ...venue,
        courts,
        totalCourts: courts.length,
        activeCourts: courts.filter(c => c.isActive).length
      };
    } catch (error) {
      await session.abortTransaction();
      logger.error('❌ Failed to create venue with courts - transaction aborted', { 
        error,
        ownerId,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    } finally {
      session.endSession();
      logger.debug('📍 Transaction session ended');
    }
  }

  /**
   * Add a new court to an existing venue
   * @throws {NotFoundError} If venue not found
   * @throws {AuthorizationError} If user is not the owner
   * @throws {ConflictError} If court number already exists
   */
  async addCourtToVenue(
    courtData: CreateCourtRequest,
    venueId: string,
    ownerId: string
  ): Promise<Court> {
    // Verify venue exists
    const venue = await this.venueRepository.findVenueById(venueId);
    
    if (!venue) {
      throw new NotFoundError(
        ERROR_MESSAGES[ERROR_CODES.COURT_NOT_FOUND],
        ERROR_CODES.COURT_NOT_FOUND,
        { venueId }
      );
    }

    // Verify ownership
    if (venue.ownerId !== ownerId) {
      throw new AuthorizationError(
        ERROR_MESSAGES[ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS],
        ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
        { 
          reason: 'You can only add courts to your own venues',
          venueId,
          ownerId: venue.ownerId
        }
      );
    }

    // Check if court number already exists
    const courtNumberExists = await this.courtRepository.courtNumberExists(
      venueId,
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
      venueId,
      isActive: courtData.isActive ?? true,
      isAvailable: courtData.isAvailable ?? true
    });

    logger.info('Court added to venue', {
      courtId: court.id,
      venueId,
      ownerId,
      courtNumber: court.courtNumber
    });

    return court;
  }

  /**
   * Get all venues and courts owned by a user
   */
  async getOwnerVenues(ownerId: string): Promise<OwnerVenuesResponse> {
    const venues = await this.venueRepository.findVenuesByOwnerId(ownerId);

    if (!venues.length) {
      logger.info('No venues found for owner', { ownerId });
      return {
        venues: [],
        courts: [],
        totalVenues: 0,
        totalCourts: 0
      };
    }

    const venueIds = venues
      .map((venue) => venue.id)
      .filter((id): id is string => Boolean(id));

    const courts = await this.courtRepository.findCourtsByVenueIds(venueIds);

    logger.debug('Owner venues retrieved', {
      ownerId,
      venueCount: venues.length,
      courtsCount: courts.length
    });

    return { 
      venues, 
      courts,
      totalVenues: venues.length,
      totalCourts: courts.length
    };
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

    // Verify ownership through venue
    const venue = await this.venueRepository.findVenueById(court.venueId);

    if (!venue || venue.ownerId !== ownerId) {
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
        court.venueId,
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
   * Delete a court (soft delete)
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
    const venue = await this.venueRepository.findVenueById(court.venueId);

    if (!venue || venue.ownerId !== ownerId) {
      throw new AuthorizationError(
        ERROR_MESSAGES[ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS],
        ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS
      );
    }

    // Check if this is the last court
    const allCourts = await this.courtRepository.findCourtsByVenueId(court.venueId);
    const activeCourts = allCourts.filter(c => c.isActive);
    
    if (activeCourts.length === 1 && activeCourts[0].id === courtId) {
      throw new BusinessLogicError(
        'Cannot delete the last active court. A venue must have at least one active court.',
        ERROR_CODES.BOOKING_INVALID_TIME,
        { venueId: court.venueId }
      );
    }

    // Soft delete
    await this.courtRepository.updateCourtById(courtId, { 
      isActive: false,
      isAvailable: false
    });

    logger.info('Court deleted successfully', { courtId, ownerId });
  }

  // ==================== VENUE OPERATIONS (Admin) ====================

  /**
   * Get all venues (Admin only)
   */
  async getAllVenues(filter: any = {}): Promise<FutsalVenue[]> {
    return await this.venueRepository.findAllVenues(filter);
  }

  /**
   * Verify a venue (Admin only)
   * @throws {NotFoundError} If venue not found
   */
  async verifyVenue(venueId: string): Promise<FutsalVenue> {
    const venue = await this.venueRepository.verifyVenue(venueId);
    
    if (!venue) {
      throw new NotFoundError(
        ERROR_MESSAGES[ERROR_CODES.COURT_NOT_FOUND],
        ERROR_CODES.COURT_NOT_FOUND,
        { venueId }
      );
    }

    logger.info('Venue verified', { venueId });

    return venue;
  }

  /**
   * Suspend a venue (Admin only)
   * @throws {NotFoundError} If venue not found
   */
  async suspendVenue(venueId: string): Promise<FutsalVenue> {
    const venue = await this.venueRepository.suspendVenue(venueId);
    
    if (!venue) {
      throw new NotFoundError(
        ERROR_MESSAGES[ERROR_CODES.COURT_NOT_FOUND],
        ERROR_CODES.COURT_NOT_FOUND,
        { venueId }
      );
    }

    logger.warn('Venue suspended', { venueId });

    return venue;
  }

  /**
   * Activate a venue (Admin only)
   */
  async activateVenue(venueId: string): Promise<FutsalVenue> {
    const venue = await this.venueRepository.activateVenue(venueId);
    
    if (!venue) {
      throw new NotFoundError(
        ERROR_MESSAGES[ERROR_CODES.COURT_NOT_FOUND],
        ERROR_CODES.COURT_NOT_FOUND,
        { venueId }
      );
    }

    logger.info('Venue activated', { venueId });

    return venue;
  }

  // ==================== PUBLIC OPERATIONS ====================

  /**
   * Search venues with filters (Public)
   */
  async searchVenues(query: VenueSearchQuery): Promise<FutsalVenue[]> {
    return await this.venueRepository.searchVenues(query);
  }

  /**
   * Get venue details by ID (Public)
   * @throws {NotFoundError} If venue not found or not public
   */
  async getVenueById(venueId: string): Promise<FutsalVenue> {
    const venue = await this.venueRepository.findVenueById(venueId);

    if (!venue || !venue.isActive || !venue.isVerified) {
      throw new NotFoundError(
        ERROR_MESSAGES[ERROR_CODES.COURT_NOT_FOUND],
        ERROR_CODES.COURT_NOT_FOUND,
        { 
          venueId,
          reason: 'Venue not found or not available for public viewing'
        }
      );
    }

    return venue;
  }

  /**
   * Get venue with all its courts (Public)
   */
  async getVenueWithCourts(venueId: string): Promise<FutsalVenueWithCourts> {
    const venue = await this.getVenueById(venueId);
    const courts = await this.courtRepository.findActiveCourtsByVenueId(venueId);

    return { 
      ...venue,
      courts,
      totalCourts: courts.length,
      activeCourts: courts.filter(c => c.isActive).length
    };
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

  /**
   * Get courts available for public consumption
   */
  async getPublicCourts(query: CourtSearchQuery = {} as CourtSearchQuery): Promise<{ courts: Court[]; count: number; }> {
    const normalizedQuery: CourtSearchQuery = {
      ...query,
      isActive: query.isActive ?? true
    };

    const courts = await this.courtRepository.searchCourts(normalizedQuery);

    logger.debug('Public courts retrieved', {
      filters: normalizedQuery,
      count: courts.length
    });

    return { courts, count: courts.length };
  }
}
