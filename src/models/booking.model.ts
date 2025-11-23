import { Schema, model, Document, Types } from 'mongoose';
import { BookingStatus, BookingType } from '../types/common.types.js';

export interface IBookingPlayer extends Document {
  userId: Types.ObjectId;
  joinedAt: Date;
  isAdmin: boolean;
  status: 'active' | 'left' | 'removed';
}

export interface IBookingInvite extends Document {
  userId: Types.ObjectId;
  invitedBy: Types.ObjectId;
  status: 'pending' | 'accepted' | 'rejected';
  invitedAt: Date;
  respondedAt?: Date;
}

export interface IBooking extends Document {
  _id: Types.ObjectId;
  courtId: Types.ObjectId;
  futsalCourtId: Types.ObjectId;
  createdBy: Types.ObjectId;
  date: Date;
  startTime: string;
  endTime: string;
  totalAmount: number;
  status: BookingStatus;
  bookingType: BookingType;
  groupType: 'public' | 'private';
  maxPlayers: number;
  players: IBookingPlayer[];
  invites: IBookingInvite[];
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  ownerApproved: boolean;
  ownerApprovedAt?: Date;
  cancelledAt?: Date;
  cancelledBy?: Types.ObjectId;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingPlayerSchema = new Schema<IBookingPlayer>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'left', 'removed'],
    default: 'active'
  }
}, { _id: false });

const BookingInviteSchema = new Schema<IBookingInvite>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  invitedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  invitedAt: {
    type: Date,
    default: Date.now
  },
  respondedAt: {
    type: Date
  }
}, { _id: false });

const BookingSchema = new Schema<IBooking>({
  courtId: {
    type: Schema.Types.ObjectId,
    ref: 'Court',
    required: true
  },
  futsalCourtId: {
    type: Schema.Types.ObjectId,
    ref: 'FutsalCourt',
    required: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: Object.values(BookingStatus),
    default: BookingStatus.PENDING
  },
  bookingType: {
    type: String,
    enum: Object.values(BookingType),
    required: true
  },
  groupType: {
    type: String,
    enum: ['public', 'private'],
    default: 'public'
  },
  maxPlayers: {
    type: Number,
    required: true,
    min: 1,
    max: 14
  },
  players: {
    type: [BookingPlayerSchema],
    default: []
  },
  invites: {
    type: [BookingInviteSchema],
    default: []
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'refunded'],
    default: 'unpaid'
  },
  ownerApproved: {
    type: Boolean,
    default: false
  },
  ownerApprovedAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },
  cancelledBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  cancellationReason: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
BookingSchema.index({ courtId: 1, date: 1, startTime: 1 });
BookingSchema.index({ createdBy: 1 });
BookingSchema.index({ status: 1 });
BookingSchema.index({ date: 1 });
BookingSchema.index({ 'players.userId': 1 });
BookingSchema.index({ 'invites.userId': 1 });

export const Booking = model<IBooking>('Booking', BookingSchema);

