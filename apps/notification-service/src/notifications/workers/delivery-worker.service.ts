import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PinoLogger } from '@repo/common';
import { Counter, Histogram } from 'prom-client';
import { NotificationChannel } from '../entities/notification-channel.entity';
import { ChannelStatus } from '../enums/channel-status.enum';
import { NotificationHandlerFactory } from '../handlers/notification-handler-factory.service';
import { SseService } from '../sse.service';

// ─── Custom Metrics ──────────────────────────────────────────────────────────
// Track total successful sends per channel and priority
const notificationsSentTotal = new Counter({
  name: 'notifications_sent_total',
  help: 'Total number of notifications successfully sent',
  labelNames: ['channel', 'priority'],
});

// Track total delivery failures with reasons
const notificationsFailedTotal = new Counter({
  name: 'notifications_failed_total',
  help: 'Total number of notification delivery failures',
  labelNames: ['channel', 'priority', 'reason'],
});

// Track delivery latency distribution
const deliveryDuration = new Histogram({
  name: 'notification_delivery_duration_seconds',
  help: 'Duration of notification delivery in seconds',
  labelNames: ['channel'],
  buckets: [0.1, 0.5, 1, 2, 5, 10], // Time buckets for latency analysis
});

/**
 * Background worker responsible for delivering pending notifications.
 * It polls the database for channels in PENDING status and dispatches them.
 */
@Injectable()
export class DeliveryWorkerService {
  private isProcessing = false;

  constructor(
    @InjectRepository(NotificationChannel)
    private readonly channelRepository: Repository<NotificationChannel>,
    private readonly handlerFactory: NotificationHandlerFactory,
    private readonly sseService: SseService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DeliveryWorkerService.name);
  }

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

    this.logger.info(`🚀 Found ${pendingChannels.length} pending notification channels to process`);

    // 2. Process each channel concurrently
    await Promise.all(
      pendingChannels.map(async (channel) => {
        // Start latency timer
        const timer = deliveryDuration.startTimer({ channel: channel.channel });
        
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

          // E. Record Success Metrics
          notificationsSentTotal.inc({ 
            channel: channel.channel, 
            priority: channel.notification.priority 
          });

          // F. Trigger real-time update via SSE
          // This tells the frontend to invalidate the cache and fetch the new notification
          this.sseService.pushNewNotification(channel.notification.userId, {
            id: channel.notification.id,
            type: channel.notification.type,
          });

          this.logger.info(`✅ Successfully sent ${channel.channel} notification for ${channel.notification.id}`);
        } catch (error) {
          // G. Mark as FAILED if delivery fails
          // The Retry Worker will pick this up later
          channel.status = ChannelStatus.FAILED;
          channel.failureReason = error.message;
          await this.channelRepository.save(channel);

          // H. Record Failure Metrics
          notificationsFailedTotal.inc({ 
            channel: channel.channel, 
            priority: channel.notification.priority,
            reason: error.message.substring(0, 50) // Truncate long error messages for labels
          });

          this.logger.error(
            `❌ Failed to deliver ${channel.channel} for notification ${channel.notification.id}: ${error.message}`
          );
        } finally {
          // Stop timer and record duration regardless of success/failure
          timer();
        }
      })
    );
  }
}
