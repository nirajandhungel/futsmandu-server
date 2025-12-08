import { BookingRepository } from '../repositories/booking.repository.js';
import { CourtRepository, VenueRepository } from '../repositories/court.repository.js';
import { UserRepository } from '../repositories/user.repository.js';
import { NotificationService } from './notification.service.js';
import {
  CreateBookingRequest,
  JoinBookingRequest,
  LeaveBookingRequest,
  InvitePlayersRequest,
  Booking,
  BookingWithDetails,
  BookingSearchQuery,
  GroupMatchListResponse,
  JoinGroupResponse
} from '../types/booking.types.js';
import {
  NotFoundError,
  ConflictError,
  AuthorizationError,
  BusinessLogicError,
  ValidationError
} from '../middleware/error.middleware.js';
import { ERROR_CODES, ERROR_MESSAGES } from '../config/constants.js';
import { BookingStatus, BookingType } from '../types/common.types.js';
import { NotificationType } from '../models/notification.model.js';
import logger from '../utils/logger.js';

export class BookingService {
  private bookingRepository: BookingRepository;
  private courtRepository: CourtRepository;
  private venueRepository: VenueRepository;
  private userRepository: UserRepository;
  private notificationService: NotificationService;

  constructor() {
    this.bookingRepository = new BookingRepository();
    this.courtRepository = new CourtRepository();
    this.venueRepository = new VenueRepository();
    this.userRepository = new UserRepository();
    this.notificationService = new NotificationService();
  }

  /**
   * Create a new booking
   */
  async createBooking(userId: string, bookingData: CreateBookingRequest): Promise<BookingWithDetails> {
    // Validate court exists
     console.log('1. bookingData.courtId on service entry:', bookingData.courtId);
    console.log('1. Type:', typeof bookingData.courtId);
     const court = await this.courtRepository.findCourtById(bookingData.courtId);

      console.log('2. After court lookup - court:', court);
  console.log('2. bookingData.courtId now:', bookingData.courtId);
  console.log('2. Type:', typeof bookingData.courtId);
    if (!court || !court.isActive) {
      throw new NotFoundError(
        ERROR_MESSAGES[ERROR_CODES.COURT_NOT_FOUND],
        ERROR_CODES.COURT_NOT_FOUND,
        { courtId: bookingData.courtId }
      );
    }

      console.log('3. Before venue lookup - court.venueId:', court.venueId);
  

    // Get venue
    const venue = await this.venueRepository.findVenueById(court.venueId);
    if (!venue) {
      throw new NotFoundError(
        ERROR_MESSAGES[ERROR_CODES.COURT_NOT_FOUND],
        ERROR_CODES.COURT_NOT_FOUND
      );
    }

      console.log('4. Before time conflict check - bookingData.courtId:', bookingData.courtId);

    // Validate date and time
    const bookingDate = new Date(bookingData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (bookingDate < today) {
      throw new ValidationError(
        'Cannot book for past dates',
        { field: 'date', value: bookingData.date }
      );
    }

    // Check for time conflicts
    const existingBookings = await this.bookingRepository.findBookingsByCourtAndDate(
      bookingData.courtId,
      bookingDate
    );

     console.log('5. Before creating booking - bookingData.courtId:', bookingData.courtId);

    const hasConflict = existingBookings.some(booking => {
      if (booking.status === BookingStatus.CANCELLED) return false;
      return this.isTimeOverlapping(
        bookingData.startTime,
        bookingData.endTime,
        booking.startTime,
        booking.endTime
      );
    });

    if (hasConflict) {
      throw new ConflictError(
        ERROR_MESSAGES[ERROR_CODES.BOOKING_SLOT_UNAVAILABLE],
        ERROR_CODES.BOOKING_SLOT_UNAVAILABLE,
        { reason: 'Time slot is already booked' }
      );
    }

    // Calculate amount
    const hours = this.calculateHours(bookingData.startTime, bookingData.endTime);
    const isPeakHour = this.isPeakHour(bookingData.startTime);
    const hourlyRate = isPeakHour ? (court.peakHourRate || court.hourlyRate) : court.hourlyRate;
    const totalAmount = hours * hourlyRate;

    // Determine max players
    const maxPlayers = bookingData.maxPlayers || court.maxPlayers;

    // Create booking
    const booking = await this.bookingRepository.createBooking({
      courtId: bookingData.courtId,
      venueId: court.venueId,
      createdBy: userId,
      date: bookingDate,
      startTime: bookingData.startTime,
      endTime: bookingData.endTime,
      totalAmount,
      status: BookingStatus.PENDING,
      bookingType: bookingData.bookingType,
      groupType: bookingData.groupType || 'public',
      maxPlayers,
      players: [{
        userId,
        joinedAt: new Date(),
        isAdmin: true,
        status: 'active'
      }],
      invites: [],
      paymentStatus: 'unpaid',
      ownerApproved: false
    });

    logger.info('Booking created', {
      bookingId: booking.id,
      userId,
      courtId: bookingData.courtId
    });

    return this.getBookingWithDetails(booking.id!);
  }

  /**
   * Join a booking as a solo player
   */
  async joinBooking(userId: string, bookingId: string): Promise<JoinGroupResponse> {
    // Get booking
    const booking = await this.bookingRepository.findBookingById(bookingId);
    if (!booking) {
      throw new NotFoundError(
        ERROR_MESSAGES[ERROR_CODES.BOOKING_NOT_FOUND],
        ERROR_CODES.BOOKING_NOT_FOUND,
        { bookingId }
      );
    }

    // Check if user is creator
    if (booking.createdBy === userId) {
      throw new BusinessLogicError(
        ERROR_MESSAGES[ERROR_CODES.BOOKING_CANNOT_JOIN_OWN],
        ERROR_CODES.BOOKING_CANNOT_JOIN_OWN
      );
    }

    // Check if already in booking
    const isAlreadyIn = await this.bookingRepository.isUserInBooking(bookingId, userId);
    if (isAlreadyIn) {
      throw new ConflictError(
        'You are already part of this booking',
        ERROR_CODES.BOOKING_DUPLICATE
      );
    }

    // Check if booking is full
    const activePlayers = booking.players.filter(p => p.status === 'active').length;
    if (activePlayers >= booking.maxPlayers) {
      throw new BusinessLogicError(
        ERROR_MESSAGES[ERROR_CODES.BOOKING_ALREADY_FULL],
        ERROR_CODES.BOOKING_ALREADY_FULL
      );
    }

    // Check if booking is still pending/confirmed
    if (booking.status !== BookingStatus.PENDING && booking.status !== BookingStatus.CONFIRMED) {
      throw new BusinessLogicError(
        'Cannot join a cancelled or completed booking',
        ERROR_CODES.BOOKING_INVALID_TIME
      );
    }

    // Check if private group - need to check for pending invite
    if (booking.groupType === 'private') {
      const pendingInvite = booking.invites.find(
        i => i.userId === userId && i.status === 'pending'
      );
      if (!pendingInvite) {
        throw new AuthorizationError(
          'This is a private group. You need an invitation to join.',
          ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS
        );
      }
    }

    // Add player
    await this.bookingRepository.addPlayerToBooking(bookingId, {
      userId,
      joinedAt: new Date(),
      isAdmin: false,
      status: 'active'
    });

    // If there was a pending invite, mark it as accepted
    if (booking.groupType === 'private') {
      await this.bookingRepository.updateInviteStatus(bookingId, userId, 'accepted');
    }

    // Get updated booking
    const updatedBooking = await this.getBookingWithDetails(bookingId);

    // Notify booking creator
    const user = await this.userRepository.findById(userId);
    if (user && updatedBooking.creator) {
      await this.notificationService.notifyPlayerJoined(
        booking.createdBy,
        userId,
        bookingId,
        user.fullName
      );
    }

    // Check if booking is now full
    const newActivePlayers = updatedBooking.players.filter(p => p.status === 'active').length;
    let autoConfirmed = false;

    if (newActivePlayers >= booking.maxPlayers) {
      // Auto-confirm if full
      await this.bookingRepository.updateBookingById(bookingId, {
        status: BookingStatus.CONFIRMED
      });

      // Notify all players
      for (const player of updatedBooking.players) {
        if (player.status === 'active') {
          await this.notificationService.notifyBookingFull(player.userId, bookingId);
        }
      }

      autoConfirmed = true;
    }

    logger.info('Player joined booking', {
      bookingId,
      userId,
      autoConfirmed
    });

    return {
      booking: updatedBooking,
      message: 'Successfully joined the booking',
      autoConfirmed
    };
  }

  /**
   * Leave a booking
   */
  async leaveBooking(userId: string, bookingId: string): Promise<BookingWithDetails> {
    const booking = await this.bookingRepository.findBookingById(bookingId);
    if (!booking) {
      throw new NotFoundError(
        ERROR_MESSAGES[ERROR_CODES.BOOKING_NOT_FOUND],
        ERROR_CODES.BOOKING_NOT_FOUND,
        { bookingId }
      );
    }

    // Check if user is in booking
    const isInBooking = await this.bookingRepository.isUserInBooking(bookingId, userId);
    if (!isInBooking) {
      throw new BusinessLogicError(
        'You are not part of this booking',
        ERROR_CODES.BOOKING_NOT_FOUND
      );
    }

    // Check if user is creator
    const isCreator = booking.createdBy === userId;
    if (isCreator) {
      throw new BusinessLogicError(
        'Booking creator cannot leave. Please cancel the booking instead.',
        ERROR_CODES.BOOKING_CANCELLATION_FAILED
      );
    }

    // Check if booking can be left (not completed)
    if (booking.status === BookingStatus.COMPLETED) {
      throw new BusinessLogicError(
        'Cannot leave a completed booking',
        ERROR_CODES.BOOKING_INVALID_TIME
      );
    }

    // Remove player
    await this.bookingRepository.removePlayerFromBooking(bookingId, userId);

    logger.info('Player left booking', { bookingId, userId });

    return this.getBookingWithDetails(bookingId);
  }

  /**
   * Invite players to a booking
   */
  async invitePlayers(userId: string, inviteData: InvitePlayersRequest): Promise<BookingWithDetails> {
    const booking = await this.bookingRepository.findBookingById(inviteData.bookingId);
    if (!booking) {
      throw new NotFoundError(
        ERROR_MESSAGES[ERROR_CODES.BOOKING_NOT_FOUND],
        ERROR_CODES.BOOKING_NOT_FOUND,
        { bookingId: inviteData.bookingId }
      );
    }

    // Check if user is part of booking
    const isInBooking = await this.bookingRepository.isUserInBooking(inviteData.bookingId, userId);
    if (!isInBooking) {
      throw new AuthorizationError(
        'Only booking participants can invite others',
        ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS
      );
    }

    // Check available slots
    const activePlayers = booking.players.filter(p => p.status === 'active').length;
    const availableSlots = booking.maxPlayers - activePlayers;

    if (inviteData.userIds.length > availableSlots) {
      throw new BusinessLogicError(
        ERROR_MESSAGES[ERROR_CODES.BOOKING_INSUFFICIENT_SLOTS],
        ERROR_CODES.BOOKING_INSUFFICIENT_SLOTS,
        { availableSlots, requested: inviteData.userIds.length }
      );
    }

    // Get inviter details
    const inviter = await this.userRepository.findById(userId);
    if (!inviter) {
      throw new NotFoundError(
        ERROR_MESSAGES[ERROR_CODES.USER_NOT_FOUND],
        ERROR_CODES.USER_NOT_FOUND
      );
    }

    // Add invites and notify users
    for (const inviteUserId of inviteData.userIds) {
      // Check if user is already in booking
      const alreadyIn = await this.bookingRepository.isUserInBooking(inviteData.bookingId, inviteUserId);
      if (alreadyIn) continue;

      // Check if invite already exists
      const existingInvite = booking.invites.find(
        i => i.userId === inviteUserId && i.status === 'pending'
      );
      if (existingInvite) continue;

      // Add invite
      await this.bookingRepository.addInviteToBooking(inviteData.bookingId, {
        userId: inviteUserId,
        invitedBy: userId,
        status: 'pending',
        invitedAt: new Date()
      });

      // Send notification
      await this.notificationService.notifyInviteReceived(
        inviteUserId,
        userId,
        inviteData.bookingId,
        inviter.fullName
      );
    }

    logger.info('Players invited to booking', {
      bookingId: inviteData.bookingId,
      inviterId: userId,
      invitedCount: inviteData.userIds.length
    });

    return this.getBookingWithDetails(inviteData.bookingId);
  }

  /**
   * Get user's bookings with enhanced filtering
   */
  async getMyBookings(userId: string, query?: BookingSearchQuery): Promise<BookingWithDetails[]> {
    logger.debug('Fetching user bookings', { userId, query });
    
    const bookings = await this.bookingRepository.findBookingsByUserId(userId, query);
    
    // Apply additional sorting if requested
    let sortedBookings = bookings;
    if (query?.sortBy) {
      sortedBookings = bookings.sort((a, b) => {
        const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
        
        switch (query.sortBy) {
          case 'date': {
            const aDate = new Date(a.date).getTime();
            const bDate = new Date(b.date).getTime();
            return (aDate - bDate) * sortOrder;
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
    
    return Promise.all(sortedBookings.map(b => this.getBookingWithDetails(b.id!)));
  }

  /**
   * Get public group matches with enhanced filtering and sorting
   */
  async getPublicGroupMatches(query?: BookingSearchQuery): Promise<GroupMatchListResponse> {
    const bookings = await this.bookingRepository.findPublicGroupMatches(query);
    
    const groups = await Promise.all(
      bookings.map(async (booking) => {
        const court = await this.courtRepository.findCourtById(booking.courtId);
        const venue = await this.venueRepository.findVenueById(booking.venueId);
        const creator = await this.userRepository.findById(booking.createdBy);

        const activePlayers = booking.players.filter(p => p.status === 'active').length;
        const availableSlots = booking.maxPlayers - activePlayers;

        return {
          bookingId: booking.id!,
          courtId: booking.courtId,
          date: booking.date,
          startTime: booking.startTime,
          endTime: booking.endTime,
          currentPlayers: activePlayers,
          maxPlayers: booking.maxPlayers,
          groupType: booking.groupType,
          status: booking.status,
          bookingType: booking.bookingType,
          courtName: court?.name || 'Unknown',
          venueName: venue?.name || 'Unknown',
          location: venue?.location || { address: '', city: '' },
          hourlyRate: court?.hourlyRate || 0,
          peakHourRate: court?.peakHourRate,
          creatorName: creator?.fullName || 'Unknown',
          creatorId: booking.createdBy,
          availableSlots,
          totalAmount: booking.totalAmount,
          createdAt: booking.createdAt
        };
      })
    );

    logger.debug('Public group matches retrieved', {
      count: groups.length,
      filters: query
    });

    return { groups };
  }

  /**
   * Get joinable bookings sorted by player count (for solo players)
   * Returns bookings that need more players, sorted by available slots (descending)
   */
  async getJoinableBookings(query?: BookingSearchQuery): Promise<GroupMatchListResponse> {
    const searchQuery: BookingSearchQuery = {
      ...query,
      groupType: 'public',
      sortBy: query?.sortBy || 'players', // Default sort by player count
      sortOrder: query?.sortOrder || 'desc', // Default: most available slots first
      availableSlots: query?.availableSlots || 1 // At least 1 slot available
    };

    return this.getPublicGroupMatches(searchQuery);
  }

  /**
   * Get booking with full details
   */
  async getBookingWithDetails(bookingId: string): Promise<BookingWithDetails> {
    const booking = await this.bookingRepository.findBookingByIdWithDetails(bookingId);
    if (!booking) {
      throw new NotFoundError(
        ERROR_MESSAGES[ERROR_CODES.BOOKING_NOT_FOUND],
        ERROR_CODES.BOOKING_NOT_FOUND,
        { bookingId }
      );
    }

     console.log('Nirajan Booking courtId:', booking.courtId);
  console.log('Type of courtId:', typeof booking.courtId);


    // Extract the actual court ID
    const courtId = typeof booking.courtId === 'string' 
      ? booking.courtId 
      : (booking.courtId as any)._id?.toString() || booking.courtId.toString();

    const venueId = typeof booking.venueId === 'string'
      ? booking.venueId
      : (booking.venueId as any)._id?.toString() || booking.venueId.toString();

    const createdBy = typeof booking.createdBy === 'string'
      ? booking.createdBy
      : (booking.createdBy as any)._id?.toString() || booking.createdBy.toString();

    const court = await this.courtRepository.findCourtById(courtId);
    const venue = await this.venueRepository.findVenueById(venueId);
    const creator = await this.userRepository.findById(createdBy);

    const playersDetails = await Promise.all(
  booking.players
    .filter(p => p.status === 'active')
    .map(async (p) => {
      // Extract userId from populated user object
      const playerUserId = typeof p.userId === 'string' 
        ? p.userId 
        : (p.userId as any)._id?.toString() || p.userId.toString();
      
      const user = await this.userRepository.findById(playerUserId);
      return {
        id: playerUserId,
        fullName: user?.fullName || 'Unknown',
        profileImage: user?.profileImage,
        joinedAt: p.joinedAt,
        isAdmin: p.isAdmin
      };
    })
);
    const bookingDTO: Booking = {
      id: booking._id.toString(),
      _id: booking._id.toString(),
      courtId: courtId,
      venueId: venueId,
      createdBy: createdBy,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      totalAmount: booking.totalAmount,
      status: booking.status,
      bookingType: booking.bookingType,
      groupType: booking.groupType,
      maxPlayers: booking.maxPlayers,
      players: booking.players.map(p => {
    // Extract userId from populated user object
    const playerUserId = typeof p.userId === 'string' 
      ? p.userId 
      : (p.userId as any)._id?.toString() || p.userId.toString();
    
    return {
      userId: playerUserId,  // Use the extracted userId
      joinedAt: p.joinedAt,
      isAdmin: p.isAdmin,
      status: p.status
    };
  }),
      invites: booking.invites.map(i => {
    // Extract userId and invitedBy from populated user objects
    const inviteUserId = typeof i.userId === 'string'
      ? i.userId
      : (i.userId as any)._id?.toString() || i.userId.toString();
    
    const inviteInvitedBy = typeof i.invitedBy === 'string'
      ? i.invitedBy
      : (i.invitedBy as any)._id?.toString() || i.invitedBy.toString();
    
    return {
      userId: inviteUserId,
      invitedBy: inviteInvitedBy,
      status: i.status,
      invitedAt: i.invitedAt,
      respondedAt: i.respondedAt
    };
  }),
      paymentStatus: booking.paymentStatus,
      ownerApproved: booking.ownerApproved,
      ownerApprovedAt: booking.ownerApprovedAt,
      cancelledAt: booking.cancelledAt,
      cancelledBy: booking.cancelledBy?.toString(),
      cancellationReason: booking.cancellationReason,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    };

    return {
      ...bookingDTO,
      court: court ? {
        id: court.id!,
        name: court.name,
        size: court.size,
        hourlyRate: court.hourlyRate,
        peakHourRate: court.peakHourRate
      } : undefined,
      venue: venue ? {
        id: venue.id!,
        name: venue.name,
        location: venue.location
      } : undefined,
      creator: creator ? {
        id: creator._id.toString(),
        fullName: creator.fullName,
        profileImage: creator.profileImage
      } : undefined,
      playersDetails
    };
  }

  /**
   * Helper: Calculate hours between two times
   */
  private calculateHours(startTime: string, endTime: string): number {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const start = startHour + startMin / 60;
    const end = endHour + endMin / 60;
    return end - start;
  }

  /**
   * Helper: Check if time is peak hour (typically 6 PM - 10 PM)
   */
  private isPeakHour(time: string): boolean {
    const [hour] = time.split(':').map(Number);
    return hour >= 18 && hour < 22;
  }

  /**
   * Approve a booking (Owner only)
   */
  async approveBooking(ownerId: string, bookingId: string): Promise<BookingWithDetails> {
    const booking = await this.bookingRepository.findBookingById(bookingId);
    if (!booking) {
      throw new NotFoundError(
        ERROR_MESSAGES[ERROR_CODES.BOOKING_NOT_FOUND],
        ERROR_CODES.BOOKING_NOT_FOUND,
        { bookingId }
      );
    }

    // Verify ownership
    const venue = await this.venueRepository.findVenueById(booking.venueId);
    if (!venue || venue.ownerId !== ownerId) {
      throw new AuthorizationError(
        ERROR_MESSAGES[ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS],
        ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
        { reason: 'You can only approve bookings for your own futsal courts' }
      );
    }

    // Update booking
    await this.bookingRepository.updateBookingById(bookingId, {
      ownerApproved: true,
      ownerApprovedAt: new Date(),
      status: BookingStatus.CONFIRMED
    });

    // Notify all players
    const updatedBooking = await this.getBookingWithDetails(bookingId);
    for (const player of updatedBooking.players) {
      if (player.status === 'active') {
        await this.notificationService.notifyBookingConfirmed(player.userId, bookingId);
      }
    }

    logger.info('Booking approved by owner', { bookingId, ownerId });

    return updatedBooking;
  }
  /**
   * Complete a booking (Owner only)
   */
  async completeBooking(ownerId: string, bookingId: string): Promise<BookingWithDetails> {
    const booking = await this.bookingRepository.findBookingById(bookingId);
    if (!booking) {
      throw new NotFoundError(
        ERROR_MESSAGES[ERROR_CODES.BOOKING_NOT_FOUND],
        ERROR_CODES.BOOKING_NOT_FOUND,
        { bookingId }
      );
    }

    // Verify ownership
    const venue = await this.venueRepository.findVenueById(booking.venueId);
    if (!venue || venue.ownerId !== ownerId) {
      throw new AuthorizationError(
        ERROR_MESSAGES[ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS],
        ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
        { reason: 'You can only complete bookings for your own futsal courts' }
      );
    }

    // Update booking
    await this.bookingRepository.updateBookingById(bookingId, {
      bookingCompleted: true,
      bookingCompletedAt: new Date(),
      status: BookingStatus.COMPLETED
    });

    // Notify all players
    const updatedBooking = await this.getBookingWithDetails(bookingId);
    for (const player of updatedBooking.players) {
      if (player.status === 'active') {
        await this.notificationService.notifyBookingCompleted(player.userId, bookingId);
      }
    }

    logger.info('Booking completed by owner', { bookingId, ownerId });

    return updatedBooking;
  }

  /**
   * Reject a booking (Owner only)
   */
  async rejectBooking(ownerId: string, bookingId: string, reason?: string): Promise<BookingWithDetails> {
    const booking = await this.bookingRepository.findBookingById(bookingId);
    if (!booking) {
      throw new NotFoundError(
        ERROR_MESSAGES[ERROR_CODES.BOOKING_NOT_FOUND],
        ERROR_CODES.BOOKING_NOT_FOUND,
        { bookingId }
      );
    }

    // Verify ownership
    const venue = await this.venueRepository.findVenueById(booking.venueId);
    if (!venue || venue.ownerId !== ownerId) {
      throw new AuthorizationError(
        ERROR_MESSAGES[ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS],
        ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
        { reason: 'You can only reject bookings for your own futsal courts' }
      );
    }

    // Update booking
    await this.bookingRepository.updateBookingById(bookingId, {
      ownerApproved: false,
      status: BookingStatus.CANCELLED,
      cancelledAt: new Date(),
      cancelledBy: ownerId,
      cancellationReason: reason || 'Rejected by owner'
    });

    // Notify all players
    const updatedBooking = await this.getBookingWithDetails(bookingId);
    for (const player of updatedBooking.players) {
      if (player.status === 'active') {
        await this.notificationService.createNotification({
          userId: player.userId,
          type: NotificationType.BOOKING_CANCELLED,
          title: 'Booking Cancelled',
          message: reason || 'Your booking has been cancelled by the owner.',
          relatedBookingId: bookingId
        });
      }
    }

    logger.info('Booking rejected by owner', { bookingId, ownerId, reason });

    return updatedBooking;
  }

  /**
   * Helper: Check if two time ranges overlap
   */
  private isTimeOverlapping(
    start1: string,
    end1: string,
    start2: string,
    end2: string
  ): boolean {
    const [s1h, s1m] = start1.split(':').map(Number);
    const [e1h, e1m] = end1.split(':').map(Number);
    const [s2h, s2m] = start2.split(':').map(Number);
    const [e2h, e2m] = end2.split(':').map(Number);

    const s1 = s1h * 60 + s1m;
    const e1 = e1h * 60 + e1m;
    const s2 = s2h * 60 + s2m;
    const e2 = e2h * 60 + e2m;

    return s1 < e2 && s2 < e1;
  }
}

