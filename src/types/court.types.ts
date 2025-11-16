export interface Court {
  id?: string;
  _id?: string;
  futsalCourtId: string;
  courtNumber: string;
  name: string;
  size: "5v5" | "6v6" | "7v7";
  amenities: string[];
  hourlyRate: number;
  peakHourRate: number;
  images: string[];
  isActive: boolean;
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
    state: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  contact: {
    phone: string;
    email: string;
  };
  amenities: string[];
  openingHours: {
    [key: string]: { open: string; close: string };
  };
  images: string[];
  isVerified: boolean;
  isActive: boolean;
  rating: number;
  totalReviews: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateCourtRequest {
  courtNumber: string;
  name: string;
  size: "5v5" | "6v6" | "7v7";
  amenities: string[];
  hourlyRate: number;
  peakHourRate: number;
  maxPlayers: number;
  openingTime: string;
  closingTime: string;
  images?: string[];
}

export interface UpdateCourtRequest {
  name?: string;
  size?: "5v5" | "6v6" | "7v7";
  amenities?: string[];
  hourlyRate?: number;
  peakHourRate?: number;
  maxPlayers?: number;
  openingTime?: string;
  closingTime?: string;
  isActive?: boolean;
  images?: string[];
}