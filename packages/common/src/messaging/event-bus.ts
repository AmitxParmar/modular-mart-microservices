import { Injectable, Inject, Module, Global } from '@nestjs/common';
import { ClientProxy, ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { createRmqOptions } from './rmq-options';

/**
 * EventBus — single producer connection for fire-and-forget event publishing.
 *
 * Every service that needs to PUBLISH domain events injects EventBus instead
 * of registering multiple ClientProxy tokens.  One token → one TCP connection.
 *
 * Usage:
 *   constructor(private readonly eventBus: EventBus) {}
 *
 *   this.eventBus.emit(EVENT_PATTERNS.ORDER_CREATED, payload);
 */
@Injectable()
export class EventBus {
  constructor(
    @Inject('RMQ_EVENT_BUS') private readonly client: ClientProxy,
  ) {}

  /**
   * Fire-and-forget event publish.
   * Use RmqRecordBuilder to attach messageId for idempotency before calling this.
   */
  emit<T>(pattern: string, payload: T): void {
    this.client.emit(pattern, payload).subscribe({
      error: (err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        // Log but don't throw — callers handle their own retry/outbox logic
        console.error(`[EventBus] Failed to emit "${pattern}": ${message}`);
      },
    });
  }
}

/**
 * EventBusModule — import this in any service that needs to publish events.
 *
 * Registers a single RMQ ClientProxy under the 'RMQ_EVENT_BUS' token, pointing
 * at the 'domain.events' exchange via the default queue ('order.events', etc.
 * are bound at the broker level).
 */
@Global()
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'RMQ_EVENT_BUS',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: createRmqOptions({
            urls: [configService.get<string>('RABBITMQ_URL') ?? ''],
            // Publisher connects through the default exchange; the broker routes
            // messages to the correct service queue based on routing key bindings.
            queue: 'domain.events',
          }),
        }),
      },
    ]),
  ],
  providers: [EventBus],
  exports: [EventBus],
})
export class EventBusModule {}
