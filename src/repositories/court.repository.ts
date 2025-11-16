import { CourtModel, FutsalCourtModel, ICourtDocument, IFutsalCourtDocument } from '../models/court.model.js';
import { Court, FutsalCourt, CreateCourtRequest, UpdateCourtRequest } from '../types/court.types.js';

export class CourtRepository {
  
  // Court Methods
  async createCourt(courtData: CreateCourtRequest & { futsalCourtId: string }): Promise<Court> {
    const court = await CourtModel.create(courtData);
    return this.transformCourt(court);
  }

  async findCourtById(courtId: string): Promise<Court | null> {
    const court = await CourtModel.findById(courtId);
    return court ? this.transformCourt(court) : null;
  }

  async findCourtsByFutsalCourtId(futsalCourtId: string): Promise<Court[]> {
    const courts = await CourtModel.find({ futsalCourtId });
    return courts.map(court => this.transformCourt(court));
  }

  async updateCourt(courtId: string, updateData: UpdateCourtRequest): Promise<Court | null> {
    const court = await CourtModel.findByIdAndUpdate(
      courtId, 
      updateData, 
      { new: true, runValidators: true }
    );
    return court ? this.transformCourt(court) : null;
  }

  async deleteCourt(courtId: string): Promise<boolean> {
    const result = await CourtModel.findByIdAndDelete(courtId);
    return !!result;
  }

  // Futsal Court Methods
  async findFutsalCourtById(futsalCourtId: string): Promise<FutsalCourt | null> {
    const futsalCourt = await FutsalCourtModel.findById(futsalCourtId);
    return futsalCourt ? this.transformFutsalCourt(futsalCourt) : null;
  }

  async findFutsalCourtsByOwner(ownerId: string): Promise<FutsalCourt[]> {
    const futsalCourts = await FutsalCourtModel.find({ ownerId });
    return futsalCourts.map(fc => this.transformFutsalCourt(fc));
  }

  async findAllFutsalCourts(filter: any = {}): Promise<FutsalCourt[]> {
    const futsalCourts = await FutsalCourtModel.find(filter);
    return futsalCourts.map(fc => this.transformFutsalCourt(fc));
  }

  async verifyFutsalCourt(futsalCourtId: string): Promise<FutsalCourt | null> {
    const futsalCourt = await FutsalCourtModel.findByIdAndUpdate(
      futsalCourtId,
      { isVerified: true },
      { new: true }
    );
    return futsalCourt ? this.transformFutsalCourt(futsalCourt) : null;
  }

  async updateFutsalCourt(futsalCourtId: string, updateData: any): Promise<FutsalCourt | null> {
    const futsalCourt = await FutsalCourtModel.findByIdAndUpdate(
      futsalCourtId,
      updateData,
      { new: true }
    );
    return futsalCourt ? this.transformFutsalCourt(futsalCourt) : null;
  }

  async searchFutsalCourts(query: any): Promise<FutsalCourt[]> {
    const futsalCourts = await FutsalCourtModel.find({
      ...query,
      isVerified: true,
      isActive: true
    });
    return futsalCourts.map(fc => this.transformFutsalCourt(fc));
  }

  // Transformation methods
  private transformCourt(court: ICourtDocument): Court {
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
      images: court.images,
      isActive: court.isActive,
      maxPlayers: court.maxPlayers,
      openingTime: court.openingTime,
      closingTime: court.closingTime,
      createdAt: court.createdAt,
      updatedAt: court.updatedAt
    };
  }

  private transformFutsalCourt(futsalCourt: IFutsalCourtDocument): FutsalCourt {
    return {
      id: futsalCourt._id.toString(),
      _id: futsalCourt._id.toString(),
      ownerId: futsalCourt.ownerId.toString(),
      name: futsalCourt.name,
      description: futsalCourt.description,
      location: futsalCourt.location,
      contact: futsalCourt.contact,
      amenities: futsalCourt.amenities,
      openingHours: futsalCourt.openingHours,
      images: futsalCourt.images,
      isVerified: futsalCourt.isVerified,
      isActive: futsalCourt.isActive,
      rating: futsalCourt.rating,
      totalReviews: futsalCourt.totalReviews,
      createdAt: futsalCourt.createdAt,
      updatedAt: futsalCourt.updatedAt
    };
  }
}