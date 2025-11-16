import { FilterQuery } from 'mongoose';
import { BaseRepository } from './base.repository.js';
import { 
  CourtModel, 
  FutsalCourtModel, 
  ICourtDocument, 
  IFutsalCourtDocument 
} from '../models/court.model.js';
import { 
  Court, 
  FutsalCourt, 
  CreateCourtRequest, 
  UpdateCourtRequest,
  CourtSearchQuery,
  FutsalCourtSearchQuery
} from '../types/court.types.js';

/**
 * Repository for Court entity operations
 * Extends BaseRepository for common CRUD operations
 */
export class CourtRepository extends BaseRepository<ICourtDocument> {
  constructor() {
    super(CourtModel);
  }

  /**
   * Create a new court
   */
  async createCourt(courtData: CreateCourtRequest & { futsalCourtId: string }): Promise<Court> {
    const court = await this.create(courtData as any);
    return this.toCourtDTO(court);
  }

  /**
   * Find court by ID
   */
  async findCourtById(courtId: string): Promise<Court | null> {
    const court = await this.findById(courtId);
    return court ? this.toCourtDTO(court) : null;
  }

  /**
   * Find all courts for a specific futsal venue
   */
  async findCourtsByFutsalCourtId(futsalCourtId: string): Promise<Court[]> {
    const courts = await this.find({ futsalCourtId } as FilterQuery<ICourtDocument>);
    return courts.map(court => this.toCourtDTO(court));
  }

  /**
   * Find active courts by futsal court ID
   */
  async findActiveCourtsByFutsalCourtId(futsalCourtId: string): Promise<Court[]> {
    const courts = await this.find({ 
      futsalCourtId, 
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
   * Check if court number exists in a futsal venue
   */
  async courtNumberExists(futsalCourtId: string, courtNumber: string, excludeCourtId?: string): Promise<boolean> {
    const filter: FilterQuery<ICourtDocument> = {
      futsalCourtId,
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

    if (query.futsalCourtId) {
      filter.futsalCourtId = query.futsalCourtId;
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
      futsalCourtId: court.futsalCourtId.toString(),
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
 * Repository for FutsalCourt entity operations
 * Extends BaseRepository for common CRUD operations
 */
export class FutsalCourtRepository extends BaseRepository<IFutsalCourtDocument> {
  constructor() {
    super(FutsalCourtModel);
  }

  /**
   * Create a new futsal court
   */
  async createFutsalCourt(courtData: any): Promise<FutsalCourt> {
    const futsalCourt = await this.create(courtData);
    return this.toFutsalCourtDTO(futsalCourt);
  }

  /**
   * Find futsal court by ID
   */
  async findFutsalCourtById(futsalCourtId: string): Promise<FutsalCourt | null> {
    const futsalCourt = await this.findById(futsalCourtId);
    return futsalCourt ? this.toFutsalCourtDTO(futsalCourt) : null;
  }

  /**
   * Find all futsal courts owned by a specific user
   */
  async findFutsalCourtsByOwnerId(ownerId: string): Promise<FutsalCourt[]> {
    const futsalCourts = await this.find({ ownerId } as FilterQuery<IFutsalCourtDocument>);
    return futsalCourts.map(fc => this.toFutsalCourtDTO(fc));
  }

  /**
   * Find all futsal courts with optional filters
   */
  async findAllFutsalCourts(filter: FilterQuery<IFutsalCourtDocument> = {}): Promise<FutsalCourt[]> {
    const futsalCourts = await this.find(filter);
    return futsalCourts.map(fc => this.toFutsalCourtDTO(fc));
  }

  /**
   * Find verified and active futsal courts (public)
   */
  async findPublicFutsalCourts(): Promise<FutsalCourt[]> {
    const futsalCourts = await this.find({ 
      isVerified: true, 
      isActive: true 
    } as FilterQuery<IFutsalCourtDocument>);
    return futsalCourts.map(fc => this.toFutsalCourtDTO(fc));
  }

  /**
   * Update futsal court by ID
   */
  async updateFutsalCourtById(futsalCourtId: string, updateData: any): Promise<FutsalCourt | null> {
    const futsalCourt = await this.updateById(futsalCourtId, updateData);
    return futsalCourt ? this.toFutsalCourtDTO(futsalCourt) : null;
  }

  /**
   * Verify a futsal court (Admin action)
   */
  async verifyFutsalCourt(futsalCourtId: string): Promise<FutsalCourt | null> {
    const futsalCourt = await this.updateById(futsalCourtId, { isVerified: true } as any);
    return futsalCourt ? this.toFutsalCourtDTO(futsalCourt) : null;
  }

  /**
   * Suspend/deactivate a futsal court
   */
  async suspendFutsalCourt(futsalCourtId: string): Promise<FutsalCourt | null> {
    const futsalCourt = await this.updateById(futsalCourtId, { isActive: false } as any);
    return futsalCourt ? this.toFutsalCourtDTO(futsalCourt) : null;
  }

  /**
   * Activate a futsal court
   */
  async activateFutsalCourt(futsalCourtId: string): Promise<FutsalCourt | null> {
    const futsalCourt = await this.updateById(futsalCourtId, { isActive: true } as any);
    return futsalCourt ? this.toFutsalCourtDTO(futsalCourt) : null;
  }

  /**
   * Search futsal courts with filters
   */
  async searchFutsalCourts(query: FutsalCourtSearchQuery): Promise<FutsalCourt[]> {
    const filter: FilterQuery<IFutsalCourtDocument> = {
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

    const futsalCourts = await this.find(filter);
    return futsalCourts.map(fc => this.toFutsalCourtDTO(fc));
  }

  /**
   * Check if futsal court exists by name and owner
   */
  async futsalCourtExistsByName(name: string, ownerId: string, excludeId?: string): Promise<boolean> {
    const filter: FilterQuery<IFutsalCourtDocument> = {
      name: { $regex: `^${name}$`, $options: 'i' },
      ownerId
    } as any;

    if (excludeId) {
      filter._id = { $ne: excludeId } as any;
    }

    return await this.exists(filter);
  }

  /**
   * Delete futsal court by ID
   */
  async deleteFutsalCourtById(futsalCourtId: string): Promise<boolean> {
    const result = await this.deleteById(futsalCourtId);
    return !!result;
  }

  /**
   * Transform MongoDB document to FutsalCourt DTO
   */
  private toFutsalCourtDTO(futsalCourt: IFutsalCourtDocument): FutsalCourt {
    return {
      id: futsalCourt._id.toString(),
      _id: futsalCourt._id.toString(),
      ownerId: futsalCourt.ownerId.toString(),
      name: futsalCourt.name,
      description: futsalCourt.description,
      location: futsalCourt.location,
      contact: futsalCourt.contact,
      amenities: futsalCourt.amenities || [],
      openingHours: futsalCourt.openingHours,
      images: futsalCourt.images || [],
      isVerified: futsalCourt.isVerified,
      isActive: futsalCourt.isActive,
      rating: futsalCourt.rating,
      totalReviews: futsalCourt.totalReviews,
      createdAt: futsalCourt.createdAt,
      updatedAt: futsalCourt.updatedAt
    };
  }
}