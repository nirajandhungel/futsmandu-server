import { Schema, model, Document, Types } from 'mongoose';

export enum NotificationType {
  BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  PLAYER_JOINED = 'PLAYER_JOINED',
  PLAYER_LEFT = 'PLAYER_LEFT',
  INVITE_RECEIVED = 'INVITE_RECEIVED',
  INVITE_ACCEPTED = 'INVITE_ACCEPTED',
  INVITE_REJECTED = 'INVITE_REJECTED',
  BOOKING_FULL = 'BOOKING_FULL',
  OWNER_APPROVED = 'OWNER_APPROVED',
  OWNER_REJECTED = 'OWNER_REJECTED',
  GROUP_JOIN_REQUEST = 'GROUP_JOIN_REQUEST',
  GROUP_JOIN_APPROVED = 'GROUP_JOIN_APPROVED',
  GROUP_JOIN_REJECTED = 'GROUP_JOIN_REJECTED'
}

export interface INotification extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  relatedBookingId?: Types.ObjectId;
  relatedUserId?: Types.ObjectId;
  isRead: boolean;
  readAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: Object.values(NotificationType),
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedBookingId: {
    type: Schema.Types.ObjectId,
    ref: 'Booking'
  },
  relatedUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });

export const Notification = model<INotification>('Notification', NotificationSchema);

