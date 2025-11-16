import { CourtRepository } from '../repositories/court.repository.js';
import { CreateCourtRequest, UpdateCourtRequest, Court, FutsalCourt } from '../types/court.types.js';
import { 
  AppError, 
  ConflictError, 
  NotFoundError, 
  AuthorizationError,
  BusinessLogicError 
} from '../middleware/error.middleware.js';
import { ERROR_CODES } from '../config/constants.js';

export class CourtService {
  private courtRepository: CourtRepository;

  constructor() {
    this.courtRepository = new CourtRepository();
  }

  // Owner Methods
  async createCourt(courtData: CreateCourtRequest, futsalCourtId: string, ownerId: string): Promise<Court> {
    const futsalCourt = await this.courtRepository.findFutsalCourtById(futsalCourtId);
    if (!futsalCourt) {
      throw new NotFoundError('Futsal court not found', ERROR_CODES.COURT_NOT_FOUND);
    }

    if (futsalCourt.ownerId !== ownerId) {
      throw new AuthorizationError('You can only add courts to your own futsal venues');
    }

    // Check if court number already exists
    const existingCourts = await this.courtRepository.findCourtsByFutsalCourtId(futsalCourtId);
    const courtWithSameNumber = existingCourts.find(court => court.courtNumber === courtData.courtNumber);
    
    if (courtWithSameNumber) {
      throw new ConflictError('Court number already exists in this venue');
    }

    return await this.courtRepository.createCourt({
      ...courtData,
      futsalCourtId
    });
  }

  async getOwnerCourts(ownerId: string): Promise<{ futsalCourts: FutsalCourt[], courts: Court[] }> {
    const futsalCourts = await this.courtRepository.findFutsalCourtsByOwner(ownerId);
    
    const courts = [];
    for (const futsalCourt of futsalCourts) {
      const venueCourts = await this.courtRepository.findCourtsByFutsalCourtId(futsalCourt.id!);
      courts.push(...venueCourts);
    }

    return { futsalCourts, courts };
  }

  async updateCourt(courtId: string, updateData: UpdateCourtRequest, ownerId: string): Promise<Court> {
    const court = await this.courtRepository.findCourtById(courtId);
    if (!court) {
      throw new NotFoundError('Court not found', ERROR_CODES.COURT_NOT_FOUND);
    }

    const futsalCourt = await this.courtRepository.findFutsalCourtById(court.futsalCourtId);
    if (!futsalCourt || futsalCourt.ownerId !== ownerId) {
      throw new AuthorizationError('Access denied');
    }

    const updatedCourt = await this.courtRepository.updateCourt(courtId, updateData);
    if (!updatedCourt) {
      throw new NotFoundError('Court not found', ERROR_CODES.COURT_NOT_FOUND);
    }

    return updatedCourt;
  }

  // Admin Methods
  async getAllFutsalCourts(filter: any = {}): Promise<FutsalCourt[]> {
    return await this.courtRepository.findAllFutsalCourts(filter);
  }

  async verifyFutsalCourt(futsalCourtId: string): Promise<FutsalCourt> {
    const futsalCourt = await this.courtRepository.verifyFutsalCourt(futsalCourtId);
    if (!futsalCourt) {
      throw new NotFoundError('Futsal court not found', ERROR_CODES.COURT_NOT_FOUND);
    }
    return futsalCourt;
  }

  async suspendFutsalCourt(futsalCourtId: string): Promise<FutsalCourt> {
    const futsalCourt = await this.courtRepository.updateFutsalCourt(futsalCourtId, { isActive: false });
    if (!futsalCourt) {
      throw new NotFoundError('Futsal court not found', ERROR_CODES.COURT_NOT_FOUND);
    }
    return futsalCourt;
  }

  // Public Methods
  async searchFutsalCourts(query: any): Promise<FutsalCourt[]> {
    return await this.courtRepository.searchFutsalCourts(query);
  }

  async getFutsalCourtWithCourts(futsalCourtId: string): Promise<{ futsalCourt: FutsalCourt, courts: Court[] }> {
    const futsalCourt = await this.courtRepository.findFutsalCourtById(futsalCourtId);
    if (!futsalCourt || !futsalCourt.isActive || !futsalCourt.isVerified) {
      throw new NotFoundError('Futsal court not found', ERROR_CODES.COURT_NOT_FOUND);
    }

    const courts = await this.courtRepository.findCourtsByFutsalCourtId(futsalCourtId);
    
    return { futsalCourt, courts };
  }

  async getCourtAvailability(courtId: string, date: string): Promise<any> {
    const court = await this.courtRepository.findCourtById(courtId);
    if (!court || !court.isActive) {
      throw new NotFoundError('Court not found', ERROR_CODES.COURT_NOT_FOUND);
    }

    return {
      court,
      date,
      availableSlots: this.generateTimeSlots(court.openingTime, court.closingTime)
    };
  }

  private generateTimeSlots(openingTime: string, closingTime: string): string[] {
    const slots: string[] = [];
    const open = parseInt(openingTime.split(':')[0]);
    const close = parseInt(closingTime.split(':')[0]);

    for (let hour = open; hour < close; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }

    return slots;
  }
}