import { FilterQuery } from 'mongoose';
import { BaseRepository } from './base.repository.js';
import { Booking, IBooking } from '../models/booking.model.js';
import { BookingStatus, BookingType } from '../types/common.types.js';
import { Booking as BookingDTO, BookingSearchQuery } from '../types/booking.types.js';

export class BookingRepository extends BaseRepository<IBooking> {
  constructor() {
    super(Booking);
  }

  /**
   * Create a new booking
   */
  async createBooking(bookingData: any): Promise<BookingDTO> {
    const booking = await this.create(bookingData);
    return this.toBookingDTO(booking);
  }

  /**
   * Find booking by ID
   */
  async findBookingById(bookingId: string): Promise<BookingDTO | null> {
    const booking = await this.findById(bookingId);
    return booking ? this.toBookingDTO(booking) : null;
  }

  // find bookings by ids 

 async findBookingsByVenueIds(venueIds: string[], query?: BookingSearchQuery): Promise<BookingDTO[]> {
    const filter: FilterQuery<IBooking> = {
      venueId: { $in: venueIds }
    };

    // Apply additional filters from query if provided
    if (query?.status) {
      filter.status = query.status;
    }

    if (query?.date) {
      const date = new Date(query.date);
      date.setHours(0, 0, 0, 0);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      filter.date = { $gte: date, $lt: nextDay };
    }

    if (query?.startDate && query?.endDate) {
      const startDate = new Date(query.startDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(query.endDate);
      endDate.setHours(23, 59, 59, 999);
      filter.date = { $gte: startDate, $lte: endDate };
    }

    if (query?.courtId) {
      filter.courtId = query.courtId;
    }

    if (query?.venueId) {
      // Override the venueId filter if specifically provided
      filter.venueId = query.venueId;
    }

    if (query?.bookingType) {
      filter.bookingType = query.bookingType;
    }

    if (query?.groupType) {
      filter.groupType = query.groupType;
    }

    const bookings = await this.find(filter);
    return bookings.map(booking => this.toBookingDTO(booking));
  }
  /**
   * Find booking by ID with populated fields
   */
  async findBookingByIdWithDetails(bookingId: string): Promise<IBooking | null> {
    return this.model
      .findById(bookingId)
      .populate('courtId', 'name size hourlyRate peakHourRate')
      .populate('venueId', 'name location')
      .populate('createdBy', 'fullName profileImage')
      .populate('players.userId', 'fullName profileImage')
      .populate('invites.userId', 'fullName profileImage')
      .populate('invites.invitedBy', 'fullName')
      .exec();
  }

  /**
   * Find bookings by user ID
   */
  async findBookingsByUserId(userId: string, query?: BookingSearchQuery): Promise<BookingDTO[]> {
    const filter: FilterQuery<IBooking> = {
      $or: [
        { createdBy: userId },
        { 'players.userId': userId }
      ]
    };

    if (query?.status) {
      filter.status = query.status;
    }

    if (query?.date) {
      const date = new Date(query.date);
      date.setHours(0, 0, 0, 0);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      filter.date = { $gte: date, $lt: nextDay };
    }

    if (query?.startDate && query?.endDate) {
      const startDate = new Date(query.startDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(query.endDate);
      endDate.setHours(23, 59, 59, 999);
      filter.date = { $gte: startDate, $lte: endDate };
    }

    if (query?.courtId) {
      filter.courtId = query.courtId;
    }

    if (query?.venueId) {
      filter.venueId = query.venueId;
    }

    if (query?.bookingType) {
      filter.bookingType = query.bookingType;
    }

    if (query?.groupType) {
      filter.groupType = query.groupType;
    }

    const bookings = await this.find(filter);
    return bookings.map(booking => this.toBookingDTO(booking));
  }

  /**
   * Find public group matches (available for joining)
   * Supports sorting and filtering by player count
   */
  async findPublicGroupMatches(query?: BookingSearchQuery): Promise<BookingDTO[]> {
    const filter: FilterQuery<IBooking> = {
      groupType: 'public',
      status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] }
    };

    if (query?.date) {
      const date = new Date(query.date);
      date.setHours(0, 0, 0, 0);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      filter.date = { $gte: date, $lt: nextDay };
    } else {
      // Only show future bookings
      filter.date = { $gte: new Date() };
    }

    if (query?.courtId) {
      filter.courtId = query.courtId;
    }

    if (query?.venueId) {
      filter.venueId = query.venueId;
    }

    if (query?.bookingType) {
      filter.bookingType = query.bookingType;
    }

    // Find bookings and apply player-based filtering
    let bookings = await this.find(filter);
    let bookingsDTO = bookings.map(booking => this.toBookingDTO(booking));

    // Apply player count filters
    if (query?.minPlayers !== undefined || query?.maxPlayers !== undefined || query?.availableSlots !== undefined) {
      bookingsDTO = bookingsDTO.filter(booking => {
        const activePlayers = booking.players.filter(p => p.status === 'active').length;
        const availableSlots = booking.maxPlayers - activePlayers;

        if (query.minPlayers !== undefined && activePlayers < query.minPlayers) {
          return false;
        }
        if (query.maxPlayers !== undefined && activePlayers > query.maxPlayers) {
          return false;
        }
        if (query.availableSlots !== undefined && availableSlots < query.availableSlots) {
          return false;
        }
        return true;
      });
    }

    // Apply sorting
    if (query?.sortBy) {
      const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
      
      bookingsDTO.sort((a, b) => {
        switch (query.sortBy) {
          case 'players': {
            const aPlayers = a.players.filter(p => p.status === 'active').length;
            const bPlayers = b.players.filter(p => p.status === 'active').length;
            return (aPlayers - bPlayers) * sortOrder;
          }
          case 'date': {
            const aDate = new Date(a.date).getTime();
            const bDate = new Date(b.date).getTime();
            return (aDate - bDate) * sortOrder;
          }
          case 'time': {
            const aTime = this.timeToMinutes(a.startTime);
            const bTime = this.timeToMinutes(b.startTime);
            return (aTime - bTime) * sortOrder;
          }
          case 'createdAt': {
            const aCreated = new Date(a.createdAt || 0).getTime();
            const bCreated = new Date(b.createdAt || 0).getTime();
            return (aCreated - bCreated) * sortOrder;
          }
          default:
            return 0;
        }
      });
    }

    return bookingsDTO;
  }

  /**
   * Helper: Convert time string to minutes for sorting
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + (minutes || 0);
  }

  /**
   * Find bookings by court ID and date
   */
  async findBookingsByCourtAndDate(courtId: string, date: Date): Promise<BookingDTO[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const filter: FilterQuery<IBooking> = {
      courtId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] }
    };

    const bookings = await this.find(filter);
    return bookings.map(booking => this.toBookingDTO(booking));
  }

  /**
   * Update booking by ID
   */
  async updateBookingById(bookingId: string, updateData: any): Promise<BookingDTO | null> {
    const booking = await this.updateById(bookingId, updateData);
    return booking ? this.toBookingDTO(booking) : null;
  }

  /**
   * Add player to booking
   */
  async addPlayerToBooking(bookingId: string, playerData: any): Promise<BookingDTO | null> {
    const booking = await this.model.findByIdAndUpdate(
      bookingId,
      { $push: { players: playerData } },
      { new: true }
    );
    return booking ? this.toBookingDTO(booking) : null;
  }

  /**
   * Remove player from booking
   */
  async removePlayerFromBooking(bookingId: string, userId: string): Promise<BookingDTO | null> {
    const booking = await this.model.findByIdAndUpdate(
      bookingId,
      { 
        $pull: { 
          players: { userId, status: 'active' } 
        },
        $push: {
          players: {
            userId,
            status: 'left',
            joinedAt: new Date(),
            isAdmin: false
          }
        }
      },
      { new: true }
    );
    return booking ? this.toBookingDTO(booking) : null;
  }

  /**
   * Add invite to booking
   */
  async addInviteToBooking(bookingId: string, inviteData: any): Promise<BookingDTO | null> {
    const booking = await this.model.findByIdAndUpdate(
      bookingId,
      { $push: { invites: inviteData } },
      { new: true }
    );
    return booking ? this.toBookingDTO(booking) : null;
  }

  /**
   * Update invite status
   */
  async updateInviteStatus(bookingId: string, userId: string, status: 'accepted' | 'rejected'): Promise<BookingDTO | null> {
    const booking = await this.model.findOneAndUpdate(
      { 
        _id: bookingId,
        'invites.userId': userId,
        'invites.status': 'pending'
      },
      {
        $set: {
          'invites.$.status': status,
          'invites.$.respondedAt': new Date()
        }
      },
      { new: true }
    );
    return booking ? this.toBookingDTO(booking) : null;
  }

  /**
   * Check if user is already in booking
   */
  async isUserInBooking(bookingId: string, userId: string): Promise<boolean> {
    const booking = await this.model.findOne({
      _id: bookingId,
      'players.userId': userId,
      'players.status': 'active'
    });
    return !!booking;
  }

  /**
   * Get active players count
   */
  async getActivePlayersCount(bookingId: string): Promise<number> {
    const booking = await this.findById(bookingId);
    if (!booking) return 0;
    return booking.players.filter(p => p.status === 'active').length;
  }

  /**
   * Find bookings by owner (through venue)
   */
  async findBookingsByOwner(ownerId: string, query?: BookingSearchQuery): Promise<BookingDTO[]> {
    // This requires populating venueId first, so we'll use aggregation
    const filter: any = {};

    if (query?.status) {
      filter.status = query.status;
    }

    if (query?.date) {
      const date = new Date(query.date);
      date.setHours(0, 0, 0, 0);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      filter.date = { $gte: date, $lt: nextDay };
    }

    const bookings = await this.model
      .find(filter)
      .populate({
        path: 'venueId',
        match: { ownerId }
      })
      .exec();

    // Filter out bookings where venueId doesn't match owner
    const filtered = bookings.filter(b => b.venueId && (b.venueId as any).ownerId?.toString() === ownerId);
    return filtered.map(booking => this.toBookingDTO(booking));
  }

  /**
   * Transform MongoDB document to Booking DTO
   */
  public toBookingDTO(booking: IBooking): BookingDTO {
    return {
      id: booking._id.toString(),
      _id: booking._id.toString(),
      courtId: booking.courtId.toString(),
      venueId: booking.venueId.toString(),
      createdBy: booking.createdBy.toString(),
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      totalAmount: booking.totalAmount,
      status: booking.status,
      bookingType: booking.bookingType,
      groupType: booking.groupType,
      maxPlayers: booking.maxPlayers,
      players: booking.players.map(p => ({
        userId: p.userId.toString(),
        joinedAt: p.joinedAt,
        isAdmin: p.isAdmin,
        status: p.status
      })),
      invites: booking.invites.map(i => ({
        userId: i.userId.toString(),
        invitedBy: i.invitedBy.toString(),
        status: i.status,
        invitedAt: i.invitedAt,
        respondedAt: i.respondedAt
      })),
      paymentStatus: booking.paymentStatus,
      ownerApproved: booking.ownerApproved,
      ownerApprovedAt: booking.ownerApprovedAt,
      cancelledAt: booking.cancelledAt,
      cancelledBy: booking.cancelledBy?.toString(),
      cancellationReason: booking.cancellationReason,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    };
  }
}

