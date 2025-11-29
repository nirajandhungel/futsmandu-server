import { BookingStatus, BookingType } from './common.types.js';

// ==================== BOOKING INTERFACES ====================

export interface BookingPlayer {
  userId: string;
  joinedAt: Date;
  isAdmin: boolean;
  status: 'active' | 'left' | 'removed';
}

export interface BookingInvite {
  userId: string;
  invitedBy: string;
  status: 'pending' | 'accepted' | 'rejected';
  invitedAt: Date;
  respondedAt?: Date;
}

export interface Booking {
  id?: string;
  _id?: string;
  courtId: string;
  venueId: string;
  createdBy: string;
  date: Date;
  startTime: string;
  endTime: string;
  totalAmount: number;
  status: BookingStatus;
  bookingType: BookingType;
  groupType: 'public' | 'private';
  maxPlayers: number;
  players: BookingPlayer[];
  invites: BookingInvite[];
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  ownerApproved: boolean;
  ownerApprovedAt?: Date;
  cancelledAt?: Date;
  cancelledBy?: string;
  cancellationReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ==================== REQUEST DTOs ====================

export interface CreateBookingRequest {
  courtId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  bookingType: BookingType;
  groupType?: 'public' | 'private';
  maxPlayers?: number;
}

export interface JoinBookingRequest {
  bookingId: string;
}

export interface LeaveBookingRequest {
  bookingId: string;
}

export interface InvitePlayersRequest {
  bookingId: string;
  userIds: string[];
}

export interface UpdateBookingRequest {
  date?: string;
  startTime?: string;
  endTime?: string;
  maxPlayers?: number;
  groupType?: 'public' | 'private';
}

// ==================== RESPONSE DTOs ====================

export interface BookingWithDetails extends Booking {
  court?: {
    id: string;
    name: string;
    size: string;
    hourlyRate: number;
    peakHourRate?: number;
  };
  venue?: {
    id: string;
    name: string;
    location: {
      address: string;
      city: string;
    };
  };
  creator?: {
    id: string;
    fullName: string;
    profileImage?: string;
  };
  playersDetails?: Array<{
    id: string;
    fullName: string;
    profileImage?: string;
    joinedAt: Date;
    isAdmin: boolean;
  }>;
}

export interface BookingListResponse {
  bookings: BookingWithDetails[];
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
  };
}

// ==================== SEARCH & FILTER ====================

export interface BookingSearchQuery {
  userId?: string;
  courtId?: string;
  venueId?: string;
  status?: BookingStatus;
  date?: string;
  startDate?: string;
  endDate?: string;
  bookingType?: BookingType;
  groupType?: 'public' | 'private';
  minPlayers?: number; // Filter by minimum current players
  maxPlayers?: number; // Filter by maximum current players
  availableSlots?: number; // Filter by available slots (needed players)
  sortBy?: 'players' | 'date' | 'time' | 'createdAt'; // Sort field
  sortOrder?: 'asc' | 'desc'; // Sort order
  page?: number;
  limit?: number;
}

// ==================== GROUP MATCHMAKING ====================

export interface GroupMatch {
  bookingId: string;
  courtId: string;
  date: Date;
  startTime: string;
  endTime: string;
  currentPlayers: number;
  maxPlayers: number;
  groupType: 'public' | 'private';
  bookingType?: BookingType;
  status: BookingStatus;
  courtName: string;
  venueName: string;
  location: {
    address: string;
    city: string;
  };
  hourlyRate: number;
  peakHourRate?: number;
  creatorName: string;
  creatorId?: string;
  availableSlots: number;
  totalAmount?: number;
  createdAt?: Date;
}

export interface GroupMatchListResponse {
  groups: GroupMatch[];
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
  };
}

export interface JoinGroupRequest {
  groupId: string; // bookingId
}

export interface JoinGroupResponse {
  booking: BookingWithDetails;
  message: string;
  autoConfirmed?: boolean;
}

