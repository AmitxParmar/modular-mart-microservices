import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PinoLogger } from '@repo/common';
import { Counter } from 'prom-client';
import { Notification } from './entities/notification.entity';
import { NotificationChannel } from './entities/notification-channel.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationListDto } from './dto/notification-list.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { PreferenceService } from './preference.service';
import { TemplateService } from './template.service';
import { NotificationChannelType } from './enums/notification-channel.enum';
import { ChannelStatus } from './enums/channel-status.enum';

// ─── Custom Metrics ──────────────────────────────────────────────────────────
// Track total notifications created, segmented by type and priority
const notificationsCreatedTotal = new Counter({
  name: 'notifications_created_total',
  help: 'Total number of notifications created',
  labelNames: ['type', 'priority'],
});

/**
 * Core service for handling notification lifecycle.
 * Manages creation, retrieval, and status updates of notifications.
 */
@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(NotificationChannel)
    private channelRepository: Repository<NotificationChannel>,
    private preferenceService: PreferenceService,
    private templateService: TemplateService,
    private readonly logger: PinoLogger,
  ) {
    // Set the context for structured logging
    this.logger.setContext(NotificationsService.name);
  }

  /**
   * Admin: Retrieves all notifications across all users with filtering.
   */
  async findAllNotifications(
    page = 1,
    limit = 50,
    type?: string,
  ): Promise<any> {
    const skip = (page - 1) * limit;
    const queryBuilder = this.notificationRepository.createQueryBuilder('notification')
      .leftJoinAndSelect('notification.channels', 'channels')
      .orderBy('notification.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (type) {
      queryBuilder.andWhere('notification.type = :type', { type });
    }

    const [items, total] = await queryBuilder.getManyAndCount();
    return {
      items: items.map(this.mapToResponseDto),
      total,
      page,
      limit,
    };
  }

  /**
   * Admin: Get statistics for notification delivery.
   */
  async getStats(): Promise<any> {
    const totalNotifications = await this.notificationRepository.count();
    const channelStats = await this.channelRepository
      .createQueryBuilder('channel')
      .select('channel.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('channel.status')
      .getRawMany();

    const typeStats = await this.notificationRepository
      .createQueryBuilder('notification')
      .select('notification.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('notification.type')
      .getRawMany();

    return {
      totalNotifications,
      byStatus: channelStats,
      byType: typeStats,
    };
  }

  /**
   * Creates a new notification and its associated delivery channels.
   * Filters channels based on user preferences unless overridden.
   * 
   * @param dto Data required to create a notification
   */
  async createNotification(dto: CreateNotificationDto): Promise<Notification> {
    const { userId, type, priority, subject, content, metadata, scheduledAt, channels: overrideChannels } = dto;

    this.logger.info(`Creating notification: ${type} for user ${userId}`);

    // 1. Determine which channels to use
    const targetChannels = overrideChannels || [NotificationChannelType.EMAIL, NotificationChannelType.IN_APP];

    // 2. Filter channels based on user preferences
    const enabledChannels: NotificationChannelType[] = [];
    for (const channelType of targetChannels) {
      if (await this.preferenceService.isChannelEnabled(userId, channelType)) {
        enabledChannels.push(channelType);
      }
    }

    // 3. Create the parent notification entity
    const notification = this.notificationRepository.create({
      userId,
      type,
      priority,
      subject,
      content,
      metadata,
      scheduledAt,
      isRead: false,
    });

    const savedNotification = await this.notificationRepository.save(notification);

    // 4. Create channel delivery records for each enabled channel
    const channelEntities = enabledChannels.map((channelType) =>
      this.channelRepository.create({
        notificationId: savedNotification.id,
        channel: channelType,
        status: ChannelStatus.PENDING,
      }),
    );

    await this.channelRepository.save(channelEntities);
    
    // 5. Increment creation metric
    notificationsCreatedTotal.inc({ type, priority });

    this.logger.info(`Notification ${savedNotification.id} created with ${channelEntities.length} channels`);
    
    savedNotification.channels = channelEntities;
    return savedNotification;
  }

  /**
   * Retrieves a paginated list of notifications for a user.
   */
  async getUserNotifications(
    userId: string,
    page = 1,
    limit = 20,
    unreadOnly = false,
  ): Promise<NotificationListDto> {
    const skip = (page - 1) * limit;

    const queryBuilder = this.notificationRepository.createQueryBuilder('notification')
      .leftJoinAndSelect('notification.channels', 'channels')
      .where('notification.userId = :userId', { userId })
      .orderBy('notification.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (unreadOnly) {
      queryBuilder.andWhere('notification.isRead = :isRead', { isRead: false });
    }

    const [items, total] = await queryBuilder.getManyAndCount();

    const unreadCount = await this.notificationRepository.count({
      where: { userId, isRead: false },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      items: items.map(this.mapToResponseDto),
      total,
      page,
      limit,
      totalPages,
      unreadCount,
    };
  }

  /**
   * Retrieves the current unread notification count for a user.
   */
  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.notificationRepository.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  /**
   * Marks a specific notification as read.
   */
  async markAsRead(id: string, userId: string): Promise<NotificationResponseDto> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
      relations: ['channels'],
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    notification.isRead = true;
    notification.readAt = new Date();
    const updated = await this.notificationRepository.save(notification);

    this.logger.debug(`Notification ${id} marked as read by user ${userId}`);

    return this.mapToResponseDto(updated);
  }

  /**
   * Marks all notifications for a user as read.
   */
  async markAllAsRead(userId: string): Promise<{ success: boolean }> {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );
    
    this.logger.info(`All notifications marked as read for user ${userId}`);
    return { success: true };
  }

  /**
   * Helper to map a Notification entity to its response DTO.
   */
  private mapToResponseDto(notification: Notification): NotificationResponseDto {
    return {
      id: notification.id,
      type: notification.type,
      priority: notification.priority,
      subject: notification.subject,
      content: notification.content,
      metadata: notification.metadata,
      isRead: notification.isRead,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
      channels: notification.channels?.map((c) => ({
        channel: c.channel,
        status: c.status,
        sentAt: c.sentAt,
        failureReason: c.failureReason,
      })) || [],
    };
  }
}
