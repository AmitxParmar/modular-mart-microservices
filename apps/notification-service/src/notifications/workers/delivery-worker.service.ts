import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationChannel } from '../entities/notification-channel.entity';
import { ChannelStatus } from '../enums/channel-status.enum';
import { NotificationHandlerFactory } from '../handlers/notification-handler-factory.service';

/**
 * Background worker responsible for delivering pending notifications.
 * It polls the database for channels in PENDING status and dispatches them.
 */
@Injectable()
export class DeliveryWorkerService {
  private readonly logger = new Logger(DeliveryWorkerService.name);
  private isProcessing = false;

  constructor(
    @InjectRepository(NotificationChannel)
    private readonly channelRepository: Repository<NotificationChannel>,
    private readonly handlerFactory: NotificationHandlerFactory,
  ) {}

  /**
   * Periodic task that runs every 30 seconds to process pending notifications.
   * Using Cron allows for automated background processing without manual triggers.
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleCron() {
    // 1. Prevent overlapping executions if a previous run is still active
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    try {
      await this.processPendingChannels();
    } catch (error) {
      this.logger.error(`❌ Delivery worker execution failed: ${error.message}`);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Main processing logic for pending channels.
   */
  private async processPendingChannels() {
    // 1. Fetch a batch of pending channels with their parent notifications
    const pendingChannels = await this.channelRepository.find({
      where: { status: ChannelStatus.PENDING },
      relations: ['notification'],
      take: 20, // Process in batches to manage resources and avoid long-running locks
    });

    if (pendingChannels.length === 0) {
      return;
    }

    this.logger.log(`🚀 Found ${pendingChannels.length} pending notification channels to process`);

    // 2. Process each channel concurrently
    await Promise.all(
      pendingChannels.map(async (channel) => {
        try {
          // A. Mark as PROCESSING to prevent other workers from picking it up
          // This is a simple form of optimistic locking
          channel.status = ChannelStatus.PROCESSING;
          await this.channelRepository.save(channel);

          // B. Get the appropriate handler from the factory
          const handler = this.handlerFactory.getHandler(channel.channel);

          // C. Attempt delivery
          await handler.send(channel.notification, channel);

          // D. Mark as SENT on success
          channel.status = ChannelStatus.SENT;
          channel.sentAt = new Date();
          await this.channelRepository.save(channel);

          this.logger.log(`✅ Successfully sent ${channel.channel} notification for ${channel.notification.id}`);
        } catch (error) {
          // E. Mark as FAILED if delivery fails
          // The Retry Worker will pick this up later
          channel.status = ChannelStatus.FAILED;
          channel.failureReason = error.message;
          await this.channelRepository.save(channel);

          this.logger.error(
            `❌ Failed to deliver ${channel.channel} for notification ${channel.notification.id}: ${error.message}`
          );
        }
      })
    );
  }
}
