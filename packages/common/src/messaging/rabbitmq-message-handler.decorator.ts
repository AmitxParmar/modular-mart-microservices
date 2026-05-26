import { applyDecorators, UseInterceptors, ExecutionContext } from '@nestjs/common';
import { EventPattern, RmqContext } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import pino from 'pino';

/**
 * Maximum number of application-level retries before a message is nacked to the DLQ.
 * Note: The broker also tracks delivery count via the `x-death` header. We use the
 * manual `x-retry-count` header so we control the counter precisely across re-publishes.
 */
const MAX_RETRIES = 3;

/**
 * Module-scoped pino logger. Using `pino()` directly (or `PinoLogger.root` when
 * nestjs-pino has initialised) avoids the constructor DI requirement of PinoLogger.
 * This is the recommended escape hatch for non-DI contexts such as inline interceptors.
 */
const logger: pino.Logger = pino({ name: 'RabbitMQMessageHandler' });

/**
 * RabbitMQMessageHandler — production-grade decorator for RMQ event consumers.
 *
 * Combines `@EventPattern` with an inline interceptor that provides:
 *  - Automatic retry up to MAX_RETRIES with exponential back-off.
 *  - DLQ routing: after MAX_RETRIES the message is nacked without requeue so the
 *    broker forwards it to the configured dead-letter exchange/queue.
 *  - Structured logging on every retry and final failure.
 *
 * Prerequisites (in main.ts / queue declaration):
 *  - The source queue must declare `deadLetterExchange` and `deadLetterRoutingKey`.
 *  - noAck must NOT be set (manual ack mode, which is the NestJS RMQ default).
 *
 * @param pattern  The RabbitMQ routing key / event pattern to listen on.
 */
export function RabbitMQMessageHandler(pattern: string) {
  return applyDecorators(
    EventPattern(pattern),
    UseInterceptors({
      intercept(context: ExecutionContext, next): Observable<unknown> {
        const rmqContext = context.switchToRpc().getContext<RmqContext>();
        const message = rmqContext.getMessage();
        const channel = rmqContext.getChannelRef();

        // Use the broker-level x-retry-count header if present; default to 0.
        const headers: Record<string, unknown> =
          (message.properties.headers as Record<string, unknown>) ?? {};
        const currentRetries = Number(headers['x-retry-count'] ?? 0);

        return next.handle().pipe(
          tap({
            error: (error: unknown) => {
              const nextRetry = currentRetries + 1;
              const errorMessage =
                error instanceof Error ? error.message : String(error);

              if (nextRetry > MAX_RETRIES) {
                // All retries exhausted — nack without requeue.
                // The broker will route to the dead-letter exchange/queue.
                logger.error(
                  {
                    pattern,
                    retries: currentRetries,
                    error: errorMessage,
                    messageId: message.properties.messageId,
                  },
                  `[RMQ] Max retries (${MAX_RETRIES}) reached for "${pattern}". Routing to DLQ.`,
                );
                channel.nack(message, false, false);
              } else {
                // Retry with exponential back-off.
                const delayMs = 1000 * Math.pow(2, currentRetries); // 1s, 2s, 4s …
                logger.warn(
                  {
                    pattern,
                    attempt: nextRetry,
                    maxRetries: MAX_RETRIES,
                    delayMs,
                    error: errorMessage,
                    messageId: message.properties.messageId,
                  },
                  `[RMQ] Error processing "${pattern}". Retry ${nextRetry}/${MAX_RETRIES} in ${delayMs}ms.`,
                );

                // Publish an updated copy of the message back to the same queue
                // with the incremented retry counter, then ack the original.
                const updatedProperties = {
                  ...message.properties,
                  headers: {
                    ...headers,
                    'x-retry-count': nextRetry,
                  },
                };

                setTimeout(() => {
                  // Derive queue name from the AMQP message routing key.
                  // RmqContext does not expose getQueue(); routingKey is set
                  // by the broker to the original queue name on publish.
                  const queue: string =
                    (message.fields as { routingKey?: string }).routingKey ??
                    (rmqContext.getPattern());
                  channel.sendToQueue(queue, message.content, updatedProperties);
                }, delayMs);

                // Ack the original so it is removed from the queue.
                channel.ack(message);
              }
            },
          }),
        );
      },
    }),
  );
}
