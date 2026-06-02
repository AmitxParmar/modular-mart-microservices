import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationChannel } from '../entities/notification-channel.entity';
import { ChannelStatus } from '../enums/channel-status.enum';

/**
 * Background worker responsible for retrying failed notification deliveries.
 * It applies an exponential backoff strategy before moving failures to an EXHAUSTED state.
 */
@Injectable()
export class RetryWorkerService {
  private readonly logger = new Logger(RetryWorkerService.name);
  private isProcessing = false;

  // Retry delays in minutes: [1 min, 5 min, 30 min]
  private readonly retryDelays = [1, 5, 30];

  constructor(
    @InjectRepository(NotificationChannel)
    private readonly channelRepository: Repository<NotificationChannel>,
  ) {}

  /**
   * Periodic task that runs every minute to check for notifications needing a retry.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    if (this.isProcessing) return;

    this.isProcessing = true;
    try {
      await this.processRetryQueue();
    } catch (error) {
      this.logger.error(`❌ Retry worker execution failed: ${error.message}`);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Main processing logic for retrying failed channels.
   */
  private async processRetryQueue() {
    // 1. Find channels that have FAILED but haven't exceeded max retries
    const failedChannels = await this.channelRepository.find({
      where: {
        status: ChannelStatus.FAILED,
      },
      take: 20,
    });

    if (failedChannels.length === 0) return;

    this.logger.log(`🔄 Checking ${failedChannels.length} failed channels for retry feasibility`);

    for (const channel of failedChannels) {
      // 2. Check if we should retry based on exponential backoff
      const shouldRetry = this.checkRetryEligibility(channel);

      if (shouldRetry) {
        this.logger.log(`🔁 Scheduling retry #${channel.retryCount + 1} for ${channel.id}`);
        
        // Update status back to PENDING so the Delivery Worker picks it up again
        channel.status = ChannelStatus.PENDING;
        channel.retryCount += 1;
        await this.channelRepository.save(channel);
      } else if (channel.retryCount >= channel.maxRetries) {
        // 3. Max retries exceeded - mark as EXHAUSTED (Dead Letter Queue equivalent)
        this.logger.warn(`🚫 Max retries reached for ${channel.id}. Marking as EXHAUSTED.`);
        channel.status = ChannelStatus.EXHAUSTED;
        await this.channelRepository.save(channel);
      }
    }
  }

  /**
   * Logic to determine if a channel is ready for its next retry attempt.
   * Compares current time with the last update time plus the backoff delay.
   */
  private checkRetryEligibility(channel: NotificationChannel): boolean {
    if (channel.retryCount >= channel.maxRetries) {
      return false;
    }

    const lastAttempt = channel.updatedAt.getTime();
    const now = new Date().getTime();
    
    // Get delay in milliseconds for the current retry attempt
    // Using index based on current retryCount
    const delayMinutes = this.retryDelays[channel.retryCount] || 60; // Default to 60 min if out of bounds
    const delayMs = delayMinutes * 60 * 1000;

    return (now - lastAttempt) >= delayMs;
  }
}
