import { applyDecorators, UseInterceptors, ExecutionContext, Logger } from '@nestjs/common';
import { EventPattern, RmqContext } from '@nestjs/microservices';
import { Observable, Observer } from 'rxjs';
import { tap } from 'rxjs/operators';
import { correlationStorage } from '../logger/correlation-id.store';
import { randomUUID } from 'node:crypto';

/**
 * Maximum application-level retries before a message is routed to the DLQ.
 *
 * Retry flow (broker-managed TTL, survives restarts and horizontal scaling):
 *   Attempt 1 (x-death count = 0): main queue  → NACK → retry1 (TTL 5 s)
 *   Attempt 2 (x-death count = 1): retry1 TTL expires → main queue → NACK → retry2 (TTL 30 s)
 *   Attempt 3 (x-death count = 2): retry2 TTL expires → main queue → NACK → DLQ (manual publish)
 *
 * The retry1 / retry2 queues must be declared with x-message-ttl + x-dead-letter-* args
 * pointing back to the main queue. bootstrapMessaging() sets this up automatically.
 */
const MAX_RETRIES = 2; // 0-indexed: 0 = first fail, 1 = second fail, 2 = route to DLQ

const logger = new Logger('RabbitMQMessageHandler');

/**
 * RabbitMQMessageHandler — production-grade decorator for RMQ event consumers.
 *
 * Combines `@EventPattern` with an inline interceptor that provides:
 *  - Correlation ID injection via AsyncLocalStorage.
 *  - Broker-native retry via TTL dead-letter queues (no setTimeout).
 *  - DLQ routing: after MAX_RETRIES the message is published to `<service>.dlq`
 *    and acked (removed from the main queue cleanly).
 *  - Structured logging on every retry and final failure.
 *
 * Prerequisites (handled by bootstrapMessaging + createRetryQueueOptions):
 *  - The main queue must declare x-dead-letter-exchange='' and
 *    x-dead-letter-routing-key=<service>.retry1.
 *  - retry1 queue: x-message-ttl=5000, DLX back to <service>.events.
 *  - retry2 queue: x-message-ttl=30000, DLX back to <service>.events.
 *
 * @param pattern    The RabbitMQ routing key / event pattern to listen on.
 * @param dlqQueue   Name of the DLQ to manually publish to on final failure.
 *                   e.g. 'catalog.dlq'. If omitted, falls back to NACK without requeue.
 */
export function RabbitMQMessageHandler(pattern: string, dlqQueue?: string) {
  return applyDecorators(
    EventPattern(pattern),
    UseInterceptors({
      intercept(context: ExecutionContext, next): Observable<unknown> {
        const rmqContext = context.switchToRpc().getContext<RmqContext>();
        const message = rmqContext.getMessage();
        const channel = rmqContext.getChannelRef();

        const headers: Record<string, unknown> =
          (message.properties.headers as Record<string, unknown>) ?? {};

        // x-death is set by the broker each time a message is dead-lettered.
        // It's an array of death records; we count total re-delivery attempts.
        const xDeath = headers['x-death'];
        const deathCount = Array.isArray(xDeath)
          ? (xDeath as Array<{ count?: number }>).reduce(
              (sum, d) => sum + (Number(d.count ?? 0)),
              0,
            )
          : 0;

        const correlationId =
          (headers['x-correlation-id'] as string) ??
          (headers['x-request-id'] as string) ??
          randomUUID();

        return new Observable((observer: Observer<unknown>) => {
          correlationStorage.run(new Map([['correlationId', correlationId]]), () => {
            const subscription = next.handle().pipe(
              tap({
                error: (error: unknown) => {
                  const errorMessage =
                    error instanceof Error ? error.message : String(error);
                  const attempt = deathCount + 1; // human-readable attempt number

                  if (deathCount >= MAX_RETRIES) {
                    // All retries exhausted — route to DLQ and ack the original.
                    logger.error(
                      `[RMQ] Max retries (${MAX_RETRIES}) reached for "${pattern}". Routing to DLQ. ` +
                      `Attempt: ${attempt} | Error: ${errorMessage} | MessageID: ${String(message.properties.messageId ?? '')}`,
                    );

                    if (dlqQueue) {
                      // Publish to named DLQ and ack so the message leaves the main queue cleanly.
                      channel.sendToQueue(
                        dlqQueue,
                        message.content,
                        {
                          ...message.properties,
                          headers: {
                            ...headers,
                            'x-failed-pattern': pattern,
                            'x-final-error': errorMessage,
                          },
                        },
                      );
                      channel.ack(message);
                    } else {
                      // No named DLQ — nack without requeue; broker routes to queue-level DLX if configured.
                      channel.nack(message, false, false);
                    }
                  } else {
                    // NACK without requeue → broker dead-letters to retry1 or retry2
                    // (based on x-dead-letter-routing-key on the main queue).
                    // The retry queue's TTL (5 s / 30 s) will route it back after the delay.
                    logger.warn(
                      `[RMQ] Error processing "${pattern}". ` +
                      `Attempt ${attempt}/${MAX_RETRIES + 1} — routing to broker retry queue. ` +
                      `Error: ${errorMessage} | MessageID: ${String(message.properties.messageId ?? '')}`,
                    );
                    channel.nack(message, false, false);
                  }
                },
              }),
            ).subscribe(observer);

            return () => subscription.unsubscribe();
          });
        });
      },
    }),
  );
}
