/**
 * Type definitions for Court and Venue entities
 */

// ==================== ENUMS ====================
export enum CourtSize {
  FIVE_VS_FIVE = '5v5',
  SIX_VS_SIX = '6v6',
  SEVEN_VS_SEVEN = '7v7'
}

export enum CourtStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance'
}

// ==================== COURT INTERFACE ====================
export interface Court {
  id?: string;
  _id?: string;
  venueId: string;
  courtNumber: string;
  name: string;
  size: CourtSize | string;
  amenities: string[];
  hourlyRate: number;
  peakHourRate?: number;
  images: string[];
  isActive: boolean;
  isAvailable: boolean;
  maxPlayers: number;
  openingTime: string;
  closingTime: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ==================== VENUE INTERFACE ====================
export interface FutsalVenue {
  id?: string;
  _id?: string;
  ownerId: string;
  name: string;
  description: string;
  location: {
    address: string;
    city: string;
    state?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  contact: {
    phone: string;
    email?: string;
    website?: string;
  };
  amenities: string[];
  openingHours: {
    monday: { open: string; close: string };
    tuesday: { open: string; close: string };
    wednesday: { open: string; close: string };
    thursday: { open: string; close: string };
    friday: { open: string; close: string };
    saturday: { open: string; close: string };
    sunday: { open: string; close: string };
  };
  images: string[];
  isVerified: boolean;
  isActive: boolean;
  rating: number;
  totalReviews: number;
  courts?:Court[];
  totalCourts?: number;
  activeCourts?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// ==================== REQUEST DTOs ====================

export interface CreateCourtRequest {
  courtNumber: string;        // Required
  name: string;              // Required  
  size: CourtSize | string;  // Required
  hourlyRate: number;        // Required
  amenities?: string[];      // Optional (default: [])
  maxPlayers?: number;       // Optional (auto-calculate: 5v5=10, 6v6=12, 7v7=14)
  openingTime?: string;      // Optional (inherit from venue)
  closingTime?: string;      // Optional (inherit from venue)
  peakHourRate?: number;     // Optional (auto-calculate: hourlyRate * 1.25)
  isActive?: boolean;        // Optional (default: true)
  isAvailable?: boolean;     // Optional (default: true)
  images?: string[];         // For uploaded court images
}

export interface UpdateCourtRequest {
  courtNumber?: string;
  name?: string;
  size?: CourtSize | string;
  amenities?: string[];
  hourlyRate?: number;
  peakHourRate?: number;
  images?: string[];
  maxPlayers?: number;
  openingTime?: string;
  closingTime?: string;
  isActive?: boolean;
  isAvailable?: boolean;
}

export interface CreateFutsalVenueRequest {
  name: string;
  description: string;
  location: {
    address: string;
    city: string;
    state?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  contact: {
    phone: string;
    email?: string;
    website?: string;
  };
  amenities?: string[];
  openingHours: {
    monday: { open: string; close: string };
    tuesday: { open: string; close: string };
    wednesday: { open: string; close: string };
    thursday: { open: string; close: string };
    friday: { open: string; close: string };
    saturday: { open: string; close: string };
    sunday: { open: string; close: string };
  };
  images?: string[];
  courts: CreateCourtRequest[]; // At least one court required (must be 5v5 or 6v6)
}

export interface UpdateFutsalVenueRequest {
  name?: string;
  description?: string;
  location?: {
    address?: string;
    city?: string;
    state?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  amenities?: string[];
  openingHours?: {
    monday: { open: string; close: string };
    tuesday: { open: string; close: string };
    wednesday: { open: string; close: string };
    thursday: { open: string; close: string };
    friday: { open: string; close: string };
    saturday: { open: string; close: string };
    sunday: { open: string; close: string };
  };
  images?: string[];
}

// ==================== SEARCH & FILTER ====================

export interface CourtSearchQuery {
  venueId?: string;
  size?: CourtSize | string;
  minRate?: number;
  maxRate?: number;
  isActive?: boolean;
  isAvailable?: boolean;
  minPlayers?: number;
  maxPlayers?: number;
}

export interface VenueSearchQuery {
  name?: string;
  city?: string;
  amenities?: string[];
  minRating?: number;
  isVerified?: boolean;
  isActive?: boolean;
  latitude?: number;
  longitude?: number;
  radius?: number; // in kilometers
}

// ==================== AVAILABILITY ====================

export interface CourtAvailability {
  courtId: string;
  courtName: string;
  date: string;
  availableSlots: string[];
  bookedSlots?: string[];
  hourlyRate: number;
  peakHourRate?: number;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  isBooked: boolean;
  rate: number;
}

// ==================== RESPONSE DTOs ====================

export interface CourtWithVenue extends Court {
  venue?: FutsalVenue;
}

export interface FutsalVenueWithCourts extends FutsalVenue {
  courts: Court[];
  totalCourts?: number;
  activeCourts?: number;
}

export interface OwnerVenuesResponse {
  venues: FutsalVenue[];
  courts: Court[];
  totalVenues: number;
  totalCourts: number;
}

// ==================== STATISTICS ====================

export interface CourtStatistics {
  courtId: string;
  totalBookings: number;
  totalRevenue: number;
  averageRating: number;
  utilizationRate: number; // percentage
  peakHours: string[];
}

export interface VenueStatistics {
  venueId: string;
  totalCourts: number;
  totalBookings: number;
  totalRevenue: number;
  averageRating: number;
  popularCourts: {
    courtId: string;
    courtName: string;
    bookingCount: number;
  }[];
}

// ==================== VALIDATION ====================

export interface CourtValidationError {
  field: string;
  message: string;
  value?: any;
}

// ==================== FILTERS ====================

export interface CourtFilters {
  venueId?: string;
  size?: CourtSize | string;
  minRate?: number;
  maxRate?: number;
  isActive?: boolean;
  amenities?: string[];
  sortBy?: 'price' | 'rating' | 'popularity';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface VenueFilters {
  city?: string;
  isVerified?: boolean;
  isActive?: boolean;
  minRating?: number;
  amenities?: string[];
  sortBy?: 'name' | 'rating' | 'distance';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// ==================== PAGINATION ====================

export interface PaginatedCourts {
  courts: Court[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface PaginatedVenues {
  venues: FutsalVenue[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
