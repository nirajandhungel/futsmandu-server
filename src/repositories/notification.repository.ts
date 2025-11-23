import { FilterQuery } from 'mongoose';
import { BaseRepository } from './base.repository.js';
import { Notification, INotification, NotificationType } from '../models/notification.model.js';

export interface NotificationDTO {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedBookingId?: string;
  relatedUserId?: string;
  isRead: boolean;
  readAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class NotificationRepository extends BaseRepository<INotification> {
  constructor() {
    super(Notification);
  }

  /**
   * Create a new notification
   */
  async createNotification(notificationData: any): Promise<NotificationDTO> {
    const notification = await this.create(notificationData);
    return this.toNotificationDTO(notification);
  }

  /**
   * Find notification by ID
   */
  async findNotificationById(notificationId: string): Promise<NotificationDTO | null> {
    const notification = await this.findById(notificationId);
    return notification ? this.toNotificationDTO(notification) : null;
  }

  /**
   * Find notifications by user ID
   */
  async findNotificationsByUserId(
    userId: string,
    options?: {
      isRead?: boolean;
      limit?: number;
      skip?: number;
    }
  ): Promise<NotificationDTO[]> {
    const filter: FilterQuery<INotification> = { userId };

    if (options?.isRead !== undefined) {
      filter.isRead = options.isRead;
    }

    let query = this.model.find(filter).sort({ createdAt: -1 });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.skip) {
      query = query.skip(options.skip);
    }

    const notifications = await query.exec();
    return notifications.map(n => this.toNotificationDTO(n));
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<NotificationDTO | null> {
    const notification = await this.updateById(notificationId, {
      isRead: true,
      readAt: new Date()
    });
    return notification ? this.toNotificationDTO(notification) : null;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.model.updateMany(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    return result.modifiedCount;
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.count({ userId, isRead: false });
  }

  /**
   * Delete notification by ID
   */
  async deleteNotification(notificationId: string): Promise<boolean> {
    const result = await this.deleteById(notificationId);
    return !!result;
  }

  /**
   * Delete all notifications for a user
   */
  async deleteAllByUserId(userId: string): Promise<number> {
    const result = await this.model.deleteMany({ userId });
    return result.deletedCount;
  }

  /**
   * Transform MongoDB document to Notification DTO
   */
  private toNotificationDTO(notification: INotification): NotificationDTO {
    return {
      id: notification._id.toString(),
      userId: notification.userId.toString(),
      type: notification.type,
      title: notification.title,
      message: notification.message,
      relatedBookingId: notification.relatedBookingId?.toString(),
      relatedUserId: notification.relatedUserId?.toString(),
      isRead: notification.isRead,
      readAt: notification.readAt,
      metadata: notification.metadata,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt
    };
  }
}

