import { Injectable, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OutboxEvent } from './entities/outbox-event.entity';
import { ClientProxy } from '@nestjs/microservices';
import { PinoLogger } from '@repo/common';

@Injectable()
export class OutboxProcessorService {
  constructor(
    @InjectRepository(OutboxEvent)
    private readonly outboxRepo: Repository<OutboxEvent>,
    @Inject('RABBITMQ_SERVICE') private readonly rabbitClient: ClientProxy,
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
        // Emit to RabbitMQ
        this.rabbitClient.emit(event.eventType, event.payload);
        
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
