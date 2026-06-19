import type { RmqOptions } from '@nestjs/microservices';

const DEFAULT_RABBITMQ_URL = 'amqp://localhost:5672';

export const RMQ_STARTUP_RETRY_ATTEMPTS = 24;
export const RMQ_STARTUP_RETRY_DELAY_MS = 5_000;

/** TTL values for broker-managed retry queues (replaces setTimeout retries). */
export const RETRY1_TTL_MS = 5_000;   // 5 s
export const RETRY2_TTL_MS = 30_000;  // 30 s

type RmqTransportOptions = NonNullable<RmqOptions['options']>;

interface RmqQueueOptions {
  urls?: string[];
  queue: string;
  deadLetterExchange?: string;
  deadLetterRoutingKey?: string;
  /** x-message-ttl for the queue in milliseconds (used for retry queues). */
  messageTtlMs?: number;
  prefetchCount?: number;
}

interface RetryLogger {
  log(message: string): void;
  warn(message: string): void;
  error(message: string, trace?: string): void;
}

interface StartRetryOptions {
  logger: RetryLogger;
  serviceName: string;
  attempts?: number;
  delayMs?: number;
}

/**
 * createRmqOptions — base options factory for any RMQ consumer or producer queue.
 *
 * Uses AMQP x-prefixed arguments (x-dead-letter-exchange, x-dead-letter-routing-key,
 * x-message-ttl) so settings are applied at the broker level, not just the client.
 */
export function createRmqOptions({
  urls,
  queue,
  deadLetterExchange,
  deadLetterRoutingKey,
  messageTtlMs,
  prefetchCount,
}: RmqQueueOptions): RmqTransportOptions {
  const resolvedUrls = urls?.filter((url) => url.trim().length > 0);
  const queueOptions: Record<string, unknown> = {
    durable: true,
  };

  // Use AMQP x-prefixed arguments — these are the actual RabbitMQ queue arguments.
  if (deadLetterExchange !== undefined) {
    queueOptions['x-dead-letter-exchange'] = deadLetterExchange;
  }

  if (deadLetterRoutingKey) {
    queueOptions['x-dead-letter-routing-key'] = deadLetterRoutingKey;
  }

  if (messageTtlMs !== undefined) {
    queueOptions['x-message-ttl'] = messageTtlMs;
  }

  return {
    urls: resolvedUrls?.length ? resolvedUrls : [DEFAULT_RABBITMQ_URL],
    queue,
    queueOptions,
    prefetchCount,
    socketOptions: {
      heartbeatIntervalInSeconds: 30,
      reconnectTimeInSeconds: 5,
    },
  };
}

/**
 * createRetryQueueOptions — options for a broker-managed TTL retry queue.
 *
 * When a message's TTL expires in this queue, the broker dead-letters it back
 * to `backToQueue` via the default exchange (empty string = direct-to-queue routing).
 *
 * Topology:
 *   <service>.events  --(NACK)-->  <service>.retry1  --(TTL 5s)-->  <service>.events
 *                                                    --(NACK)-->  <service>.retry2  --(TTL 30s)-->  <service>.events
 *                                                                                   --(NACK)-->  <service>.dlq (via decorator)
 */
export function createRetryQueueOptions({
  urls,
  retryQueue,
  backToQueue,
  ttlMs,
}: {
  urls: string[];
  retryQueue: string;
  backToQueue: string;
  ttlMs: number;
}): RmqTransportOptions {
  return createRmqOptions({
    urls,
    queue: retryQueue,
    deadLetterExchange: '',      // default exchange — routes by queue name directly
    deadLetterRoutingKey: backToQueue,
    messageTtlMs: ttlMs,
  });
}

export async function startAllMicroservicesWithRetry(
  start: () => Promise<unknown>,
  {
    logger,
    serviceName,
    attempts = RMQ_STARTUP_RETRY_ATTEMPTS,
    delayMs = RMQ_STARTUP_RETRY_DELAY_MS,
  }: StartRetryOptions,
): Promise<void> {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await start();
      logger.log(
        `RabbitMQ consumers connected for ${serviceName} on attempt ${attempt}/${attempts}`,
      );
      return;
    } catch (err) {
      const error = err as Error;

      if (attempt === attempts) {
        logger.error(
          `RabbitMQ consumers failed to connect for ${serviceName} after ${attempts} attempts. HTTP will stay online, but events will not be consumed until the service restarts.`,
          error.stack,
        );
        return;
      }

      logger.warn(
        `RabbitMQ unavailable for ${serviceName} (${error.message}). Retrying in ${delayMs}ms (${attempt}/${attempts}).`,
      );
      await sleep(delayMs);
    }
  }
}

function sleep(delayMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}
