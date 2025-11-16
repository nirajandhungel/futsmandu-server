/**
 * Type definitions for Court-related entities
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

// ==================== COURT INTERFACES ====================

export interface Court {
  id?: string;
  _id?: string;
  futsalCourtId: string;
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

export interface FutsalCourt {
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
  createdAt?: Date;
  updatedAt?: Date;
}

// ==================== REQUEST DTOs ====================

export interface CreateCourtRequest {
  courtNumber: string;
  name: string;
  size: CourtSize | string;
  amenities?: string[];
  hourlyRate: number;
  peakHourRate?: number;
  images?: string[];
  maxPlayers: number;
  openingTime: string;
  closingTime: string;
  isActive?: boolean;
  isAvailable: boolean; 
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
  isAvailable: boolean; 
}

export interface CreateFutsalCourtRequest {
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
}

export interface UpdateFutsalCourtRequest {
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
}

// ==================== SEARCH & FILTER ====================

export interface CourtSearchQuery {
  futsalCourtId?: string;
  size?: CourtSize | string;
  minRate?: number;
  maxRate?: number;
  isActive?: boolean;
  minPlayers?: number;
  maxPlayers?: number;
}

export interface FutsalCourtSearchQuery {
  name?: string;
  city?: string;
  amenities?: string[];
  minRating?: number;
  isVerified?: boolean;
  isActive?: boolean;
  
  // Coordinates for location-based search
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

export interface CourtWithFutsalCourt extends Court {
  futsalCourt?: FutsalCourt;
}

export interface FutsalCourtWithCourts extends FutsalCourt {
  courts?: Court[];
  totalCourts?: number;
  activeCourts?: number;
}

export interface OwnerCourtsResponse {
  futsalCourts: FutsalCourt[];
  courts: Court[];
  totalFutsalCourts: number;
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

export interface FutsalCourtStatistics {
  futsalCourtId: string;
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
  futsalCourtId?: string;
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

export interface FutsalCourtFilters {
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

export interface PaginatedFutsalCourts {
  futsalCourts: FutsalCourt[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}