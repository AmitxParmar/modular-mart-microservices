import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OutboxEvent } from './entities/outbox-event.entity';
import { RmqRecordBuilder } from '@nestjs/microservices';
import { PinoLogger, EventBus, BusinessMetricsService } from '@repo/common';

@Injectable()
export class OutboxProcessorService {
  constructor(
    @InjectRepository(OutboxEvent)
    private readonly outboxRepo: Repository<OutboxEvent>,
    private readonly eventBus: EventBus,
    private readonly logger: PinoLogger,
    private readonly metrics: BusinessMetricsService,
  ) {}

  // Runs every 5 seconds
  @Cron(CronExpression.EVERY_5_SECONDS)
  async processOutboxEvents() {
    // Find up to 50 unprocessed events, sorted by oldest first
    const events = await this.outboxRepo.find({
      where: { processed: false },
      order: { createdAt: 'ASC' },
      take: 50,
    });

    // Always update health gauges — even when the outbox is empty
    this.metrics.outboxPendingGauge.set(events.length);

    if (events.length === 0) {
      this.metrics.outboxOldestEventAgeGauge.set(0);
      return;
    }

    // Track age of oldest pending event — alert if this grows unbounded
    const oldestEvent = events[0];
    const ageSeconds = (Date.now() - oldestEvent.createdAt.getTime()) / 1000;
    this.metrics.outboxOldestEventAgeGauge.set(ageSeconds);

    this.logger.debug(
      `Found ${events.length} unprocessed outbox events (oldest: ${ageSeconds.toFixed(1)}s)`,
    );

    for (const event of events) {
      try {
        // Emit to RabbitMQ using RmqRecordBuilder to set the unique message ID
        const record = new RmqRecordBuilder(event.payload)
          .setOptions({
            messageId: event.id,
          })
          .build();
        
        // Route is determined by the event pattern (routing key), not by which client
        // we use. EventBus publishes to domain.events exchange; the broker routes
        // based on the pattern to the correct service queue.
        this.eventBus.emit(event.eventType, record);
        
        // Mark as processed
        event.processed = true;
        event.processedAt = new Date();
        await this.outboxRepo.save(event);

        this.metrics.outboxPendingEvents.inc();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(
          `Failed to process outbox event ${event.id} of type ${event.eventType}: ${message}`,
          error instanceof Error ? error.stack : undefined,
        );
        event.errorMessage = message;
        await this.outboxRepo.save(event);
        this.metrics.outboxFailedEvents.inc();
      }
    }
  }
}
