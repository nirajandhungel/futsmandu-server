import { FilterQuery } from 'mongoose';
import { BaseRepository } from './base.repository.js';
import { 
  CourtModel, 
  FutsalVenueModel, 
  ICourtDocument, 
  IFutsalVenueDocument 
} from '../models/court.model.js';
import { 
  Court, 
  FutsalVenue, 
  CreateCourtRequest, 
  UpdateCourtRequest,
  CourtSearchQuery,
  VenueSearchQuery
} from '../types/court.types.js';

/**
 * Repository for Court entity operations
 */
export class CourtRepository extends BaseRepository<ICourtDocument> {
  constructor() {
    super(CourtModel);
  }

  /**
   * Create a new court
   */
  async createCourt(courtData: CreateCourtRequest & { venueId: string }, session?: any): Promise<Court> {
    const court = await this.create(courtData as any, session);
    return this.toCourtDTO(court);
  }

  /**
   * Create multiple courts for a venue
   */
  async createCourts(courtsData: (CreateCourtRequest & { venueId: string })[], session?: any): Promise<Court[]> {
    const options = session ? { session } : {};
    const courts = await this.model.insertMany(courtsData as any, options);
    return courts.map((court: ICourtDocument) => this.toCourtDTO(court));
  }

  /**
   * Find court by ID
   */
  async findCourtById(courtId: string): Promise<Court | null> {
    const court = await this.findById(courtId);
    return court ? this.toCourtDTO(court) : null;
  }

    /**
   * Find all courts with optional filters
   */
  async findAllCourts(filter: FilterQuery<ICourtDocument> = {}): Promise<Court[]> {
    const courts = await this.find(filter);
    return courts.map(v => this.toCourtDTO(v));
  }

  /**
   * Find all courts for a specific venue
   */
  async findCourtsByVenueId(venueId: string): Promise<Court[]> {
    const courts = await this.find({ venueId } as FilterQuery<ICourtDocument>);
    return courts.map(court => this.toCourtDTO(court));
  }

  /**
   * Find courts by multiple venue IDs
   */
  async findCourtsByVenueIds(venueIds: string[]): Promise<Court[]> {
    if (!venueIds.length) {
      return [];
    }

    const courts = await this.find({
      venueId: { $in: venueIds }
    } as FilterQuery<ICourtDocument>);

    return courts.map((court) => this.toCourtDTO(court));
  }

  /**
   * Find active courts by venue ID
   */
  async findActiveCourtsByVenueId(venueId: string): Promise<Court[]> {
    const courts = await this.find({ 
      venueId, 
      isActive: true 
    } as FilterQuery<ICourtDocument>);
    return courts.map(court => this.toCourtDTO(court));
  }

  /**
   * Update court by ID
   */
  async updateCourtById(courtId: string, updateData: UpdateCourtRequest): Promise<Court | null> {
    const court = await this.updateById(courtId, updateData as any);
    return court ? this.toCourtDTO(court) : null;
  }

  /**
   * Delete court by ID
   */
  async deleteCourtById(courtId: string): Promise<boolean> {
    const result = await this.deleteById(courtId);
    return !!result;
  }

  /**
   * Check if court number exists in a venue
   */
  async courtNumberExists(venueId: string, courtNumber: string, excludeCourtId?: string): Promise<boolean> {
    const filter: FilterQuery<ICourtDocument> = {
      venueId,
      courtNumber
    } as any;

    if (excludeCourtId) {
      filter._id = { $ne: excludeCourtId } as any;
    }

    return await this.exists(filter);
  }

  /**
   * Search courts with filters
   */
  async searchCourts(query: CourtSearchQuery): Promise<Court[]> {
    const filter: FilterQuery<ICourtDocument> = {} as any;

    if (query.venueId) {
      filter.venueId = query.venueId;
    }

    if (query.size) {
      filter.size = query.size;
    }

    if (query.minRate !== undefined || query.maxRate !== undefined) {
      filter.hourlyRate = {} as any;
      if (query.minRate !== undefined) {
        (filter.hourlyRate as any).$gte = query.minRate;
      }
      if (query.maxRate !== undefined) {
        (filter.hourlyRate as any).$lte = query.maxRate;
      }
    }

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    if (query.isAvailable !== undefined) {
      filter.isAvailable = query.isAvailable;
    }

    if (query.minPlayers !== undefined || query.maxPlayers !== undefined) {
      filter.maxPlayers = filter.maxPlayers || ({} as any);
      if (query.minPlayers !== undefined) {
        (filter.maxPlayers as any).$gte = query.minPlayers;
      }
      if (query.maxPlayers !== undefined) {
        (filter.maxPlayers as any).$lte = query.maxPlayers;
      }
    }

    const courts = await this.find(filter);
    return courts.map(court => this.toCourtDTO(court));
  }

  /**
   * Transform MongoDB document to Court DTO
   */
  private toCourtDTO(court: ICourtDocument): Court {
    return {
      id: court._id.toString(),
      _id: court._id.toString(),
      venueId: court.venueId.toString(),
      courtNumber: court.courtNumber,
      name: court.name,
      size: court.size,
      amenities: court.amenities,
      hourlyRate: court.hourlyRate,
      peakHourRate: court.peakHourRate,
      images: court.images || [],
      isActive: court.isActive,
      isAvailable: court.isAvailable,
      maxPlayers: court.maxPlayers,
      openingTime: court.openingTime,
      closingTime: court.closingTime,
      createdAt: court.createdAt,
      updatedAt: court.updatedAt
    };
  }
}

/**
 * Repository for FutsalVenue entity operations
 */
export class VenueRepository extends BaseRepository<IFutsalVenueDocument> {
  constructor() {
    super(FutsalVenueModel);
  }

  /**
   * Create a new venue
   */
  async createVenue(venueData: any, session?: any): Promise<FutsalVenue> {
    const venue = await this.create(venueData, session);
    return this.toVenueDTO(venue);
  }

  /**
   * Find venue by ID
   */
  async findVenueById(venueId: string): Promise<FutsalVenue | null> {
    const venue = await this.findById(venueId);
    return venue ? this.toVenueDTO(venue) : null;
  }

  /**
   * Find all venues owned by a specific user
   */
  async findVenuesByOwnerId(ownerId: string): Promise<FutsalVenue[]> {
    const venues = await this.find({ ownerId } as FilterQuery<IFutsalVenueDocument>);
    return venues.map(v => this.toVenueDTO(v));
  }

  /**
   * Find all venues with optional filters
   */
  async findAllVenues(filter: FilterQuery<IFutsalVenueDocument> = {}): Promise<FutsalVenue[]> {
    const venues = await this.find(filter);
    return venues.map(v => this.toVenueDTO(v));
  }

  /**
   * Find verified and active venues (public)
   */
  async findPublicVenues(): Promise<FutsalVenue[]> {
    const venues = await this.find({ 
      isVerified: true, 
      isActive: true 
    } as FilterQuery<IFutsalVenueDocument>);
    return venues.map(v => this.toVenueDTO(v));
  }

  /**
   * Update venue by ID
   */
  async updateVenueById(venueId: string, updateData: any): Promise<FutsalVenue | null> {
    const venue = await this.updateById(venueId, updateData);
    return venue ? this.toVenueDTO(venue) : null;
  }

  /**
   * Verify a venue (Admin action)
   */
  async verifyVenue(venueId: string): Promise<FutsalVenue | null> {
    const venue = await this.updateById(venueId, { isVerified: true } as any);
    return venue ? this.toVenueDTO(venue) : null;
  }

  /**
   * Suspend/deactivate a venue
   */
  async suspendVenue(venueId: string): Promise<FutsalVenue | null> {
    const venue = await this.updateById(venueId, { isActive: false } as any);
    return venue ? this.toVenueDTO(venue) : null;
  }

  /**
   * Activate a venue
   */
  async activateVenue(venueId: string): Promise<FutsalVenue | null> {
    const venue = await this.updateById(venueId, { isActive: true } as any);
    return venue ? this.toVenueDTO(venue) : null;
  }

  /**
   * Search venues with filters
   */
  async searchVenues(query: VenueSearchQuery): Promise<FutsalVenue[]> {
    const filter: FilterQuery<IFutsalVenueDocument> = {
      isVerified: true,
      isActive: true
    } as any;

    if (query.name) {
      filter.name = { $regex: query.name, $options: 'i' } as any;
    }

    if (query.city) {
      filter['location.city'] = { $regex: query.city, $options: 'i' } as any;
    }

    if (query.amenities && query.amenities.length > 0) {
      filter.amenities = { $all: query.amenities } as any;
    }

    if (query.minRating !== undefined) {
      filter.rating = { $gte: query.minRating } as any;
    }

    const venues = await this.find(filter);
    return venues.map(v => this.toVenueDTO(v));
  }

  /**
   * Check if venue exists by name and owner
   */
  async venueExistsByName(name: string, ownerId: string, excludeId?: string): Promise<boolean> {
    const filter: FilterQuery<IFutsalVenueDocument> = {
      name: { $regex: `^${name}$`, $options: 'i' },
      ownerId
    } as any;

    if (excludeId) {
      filter._id = { $ne: excludeId } as any;
    }

    return await this.exists(filter);
  }

  /**
   * Delete venue by ID
   */
  async deleteVenueById(venueId: string): Promise<boolean> {
    const result = await this.deleteById(venueId);
    return !!result;
  }

  /**
   * Transform MongoDB document to Venue DTO
   */
  private toVenueDTO(venue: IFutsalVenueDocument): FutsalVenue {
    return {
      id: venue._id.toString(),
      _id: venue._id.toString(),
      ownerId: venue.ownerId.toString(),
      name: venue.name,
      description: venue.description,
      location: venue.location,
      contact: venue.contact,
      amenities: venue.amenities || [],
      openingHours: venue.openingHours,
      images: venue.images || [],
      isVerified: venue.isVerified,
      isActive: venue.isActive,
      rating: venue.rating,
      totalReviews: venue.totalReviews,
      createdAt: venue.createdAt,
      updatedAt: venue.updatedAt
    };
  }
}
