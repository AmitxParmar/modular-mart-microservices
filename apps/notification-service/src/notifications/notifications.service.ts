import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationChannel } from './entities/notification-channel.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationListDto } from './dto/notification-list.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { PreferenceService } from './preference.service';
import { TemplateService } from './template.service';
import { NotificationChannelType } from './enums/notification-channel.enum';
import { ChannelStatus } from './enums/channel-status.enum';

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
  ) {}

  /**
   * Creates a new notification and its associated delivery channels.
   * Filters channels based on user preferences unless overridden.
   * 
   * @param dto Data required to create a notification
   */
  async createNotification(dto: CreateNotificationDto): Promise<Notification> {
    const { userId, type, priority, subject, content, metadata, scheduledAt, channels: overrideChannels } = dto;

    // 1. Determine which channels to use
    // If overrideChannels is provided, use them. Otherwise, default to [EMAIL, IN_APP].
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
    
    // Return the notification with its channels
    savedNotification.channels = channelEntities;
    return savedNotification;
  }

  /**
   * Retrieves a paginated list of notifications for a user.
   * 
   * @param userId The ID of the user
   * @param page Current page number
   * @param limit Number of items per page
   * @param unreadOnly Filter by unread status
   */
  async getUserNotifications(
    userId: string,
    page = 1,
    limit = 20,
    unreadOnly = false,
  ): Promise<NotificationListDto> {
    const skip = (page - 1) * limit;

    // 1. Build the query
    const queryBuilder = this.notificationRepository.createQueryBuilder('notification')
      .leftJoinAndSelect('notification.channels', 'channels')
      .where('notification.userId = :userId', { userId })
      .orderBy('notification.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (unreadOnly) {
      queryBuilder.andWhere('notification.isRead = :isRead', { isRead: false });
    }

    // 2. Execute query and count
    const [items, total] = await queryBuilder.getManyAndCount();

    // 3. Get total unread count for the badge
    const unreadCount = await this.notificationRepository.count({
      where: { userId, isRead: false },
    });

    const totalPages = Math.ceil(total / limit);

    // 4. Transform to DTO response
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
