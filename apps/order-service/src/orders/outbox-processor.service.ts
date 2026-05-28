import { Injectable, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OutboxEvent } from './entities/outbox-event.entity';
import { ClientProxy, RmqRecordBuilder } from '@nestjs/microservices';
import { PinoLogger } from 'nestjs-pino';
import { EVENT_PATTERNS } from '@repo/contracts';

@Injectable()
export class OutboxProcessorService {
  constructor(
    @InjectRepository(OutboxEvent)
    private readonly outboxRepo: Repository<OutboxEvent>,
    @Inject('CATALOG_SERVICE') private readonly catalogClient: ClientProxy,
    @Inject('PAYMENT_SERVICE') private readonly paymentClient: ClientProxy,
    private readonly logger: PinoLogger,
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

    if (events.length === 0) {
      return;
    }

    this.logger.debug(`Found ${events.length} unprocessed outbox events`);

    for (const event of events) {
      try {
        // Emit to RabbitMQ using RmqRecordBuilder to set the unique message ID
        const record = new RmqRecordBuilder(event.payload)
          .setOptions({
            messageId: event.id,
          })
          .build();
        
        let client: ClientProxy;
        if (event.eventType === EVENT_PATTERNS.ORDER_CREATED) {
          client = this.paymentClient;
        } else {
          // Default to catalog service for stock reserve/cancelled/rejected events
          client = this.catalogClient;
        }

        client.emit(event.eventType, record);
        
        // Mark as processed
        event.processed = true;
        event.processedAt = new Date();
        await this.outboxRepo.save(event);
      } catch (error) {
        this.logger.error(
          `Failed to process outbox event ${event.id} of type ${event.eventType}`,
          error.stack,
        );
        event.errorMessage = error.message;
        await this.outboxRepo.save(event);
      }
    }
  }
}
