import { Schema, model, Document, Types } from 'mongoose';

// ==================== COURT DOCUMENT INTERFACE ====================
export interface ICourtDocument extends Document {
  _id: Types.ObjectId;
  venueId: Types.ObjectId;
  courtNumber: string;
  name: string;
  size: '5v5' | '6v6' | '7v7';
  amenities: string[];
  hourlyRate: number;
  peakHourRate: number;
  images: string[];
  isActive: boolean;
  isAvailable: boolean;
  maxPlayers: number;
  openingTime: string;
  closingTime: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== VENUE DOCUMENT INTERFACE ====================
export interface IFutsalVenueDocument extends Document {
  _id: Types.ObjectId;
  ownerId: Types.ObjectId;
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
  createdAt: Date;
  updatedAt: Date;
}

// ==================== COURT SCHEMA ====================
const courtSchema = new Schema<ICourtDocument>({
  venueId: {
    type: Schema.Types.ObjectId,
    ref: 'FutsalVenue',
    required: true
  },
  courtNumber: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  size: {
    type: String,
    enum: ['5v5', '6v6', '7v7'],
    required: true
  },
  amenities: [{
    type: String
  }],
  hourlyRate: {
    type: Number,
    required: true,
    min: 0
  },
  peakHourRate: {
    type: Number,
    required: true,
    min: 0
  },
  images: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  maxPlayers: {
    type: Number,
    required: true,
    min: 10,
    max: 14
  },
  openingTime: {
    type: String,
    required: true
  },
  closingTime: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// ==================== VENUE SCHEMA ====================
const futsalVenueSchema = new Schema<IFutsalVenueDocument>({
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  location: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: false },
    coordinates: {
      latitude: { type: Number, required: false },
      longitude: { type: Number, required: false }
    }
  },
  contact: {
    phone: { type: String, required: true },
    email: { type: String, required: false }
  },
  amenities: [{
    type: String
  }],
  openingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  },
  images: [{
    type: String
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// ==================== INDEXES ====================
courtSchema.index({ venueId: 1, courtNumber: 1 }, { unique: true });
courtSchema.index({ isActive: 1 });
courtSchema.index({ venueId: 1 });
futsalVenueSchema.index({ ownerId: 1 });
futsalVenueSchema.index({ 'location.coordinates': '2dsphere' });
futsalVenueSchema.index({ isVerified: 1, isActive: 1 });

// ==================== EXPORTS ====================
export const CourtModel = model<ICourtDocument>('Court', courtSchema);
export const FutsalVenueModel = model<IFutsalVenueDocument>('FutsalVenue', futsalVenueSchema);
