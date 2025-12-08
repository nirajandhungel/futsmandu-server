import { NotificationRepository } from '../repositories/notification.repository.js';
import { NotificationType } from '../models/notification.model.js';

export class NotificationService {
  private notificationRepository: NotificationRepository;

  constructor() {
    this.notificationRepository = new NotificationRepository();
  }

  /**
   * Create a notification
   */
  async createNotification(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    relatedBookingId?: string;
    relatedUserId?: string;
    metadata?: Record<string, any>;
  }) {
    return this.notificationRepository.createNotification(data);
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(
    userId: string,
    options?: {
      isRead?: boolean;
      limit?: number;
      skip?: number;
    }
  ) {
    return this.notificationRepository.findNotificationsByUserId(userId, options);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    // Verify ownership
    const notification = await this.notificationRepository.findNotificationById(notificationId);
    if (!notification || notification.userId !== userId) {
      throw new Error('Notification not found or access denied');
    }
    return this.notificationRepository.markAsRead(notificationId);
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    return this.notificationRepository.markAllAsRead(userId);
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string) {
    return this.notificationRepository.getUnreadCount(userId);
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string) {
    // Verify ownership
    const notification = await this.notificationRepository.findNotificationById(notificationId);
    if (!notification || notification.userId !== userId) {
      throw new Error('Notification not found or access denied');
    }
    return this.notificationRepository.deleteNotification(notificationId);
  }

  /**
   * Helper: Create booking confirmed notification
   */
  async notifyBookingConfirmed(userId: string, bookingId: string, metadata?: Record<string, any>) {
    return this.createNotification({
      userId,
      type: NotificationType.BOOKING_CONFIRMED,
      title: 'Booking Confirmed',
      message: 'Your booking has been confirmed by the owner.',
      relatedBookingId: bookingId,
      metadata
    });
  }
  /**
   * Helper: Create booking confirmed notification
   */
  async notifyBookingCompleted(userId: string, bookingId: string, metadata?: Record<string, any>) {
    return this.createNotification({
      userId,
      type: NotificationType.BOOKING_CONFIRMED,
      title: 'Booking Completed',
      message: 'Your booking has been completed by the owner.',
      relatedBookingId: bookingId,
      metadata
    });
  }

  /**
   * Helper: Create player joined notification
   */
  async notifyPlayerJoined(bookingCreatorId: string, playerId: string, bookingId: string, playerName: string) {
    return this.createNotification({
      userId: bookingCreatorId,
      type: NotificationType.PLAYER_JOINED,
      title: 'New Player Joined',
      message: `${playerName} joined your booking.`,
      relatedBookingId: bookingId,
      relatedUserId: playerId,
      metadata: { playerName }
    });
  }

  /**
   * Helper: Create invite received notification
   */
  async notifyInviteReceived(userId: string, inviterId: string, bookingId: string, inviterName: string) {
    return this.createNotification({
      userId,
      type: NotificationType.INVITE_RECEIVED,
      title: 'Booking Invitation',
      message: `${inviterName} invited you to join a booking.`,
      relatedBookingId: bookingId,
      relatedUserId: inviterId,
      metadata: { inviterName }
    });
  }

  /**
   * Helper: Create booking full notification
   */
  async notifyBookingFull(userId: string, bookingId: string) {
    return this.createNotification({
      userId,
      type: NotificationType.BOOKING_FULL,
      title: 'Booking Full',
      message: 'Your booking is now full and has been auto-confirmed.',
      relatedBookingId: bookingId
    });
  }
}

