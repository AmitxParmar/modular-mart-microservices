import type { RmqOptions } from '@nestjs/microservices';

const DEFAULT_RABBITMQ_URL = 'amqp://localhost:5672';

export const RMQ_STARTUP_RETRY_ATTEMPTS = 24;
export const RMQ_STARTUP_RETRY_DELAY_MS = 5_000;

type RmqTransportOptions = NonNullable<RmqOptions['options']>;

interface RmqQueueOptions {
  urls?: string[];
  queue: string;
  deadLetterExchange?: string;
  deadLetterRoutingKey?: string;
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

export function createRmqOptions({
  urls,
  queue,
  deadLetterExchange,
  deadLetterRoutingKey,
  prefetchCount,
}: RmqQueueOptions): RmqTransportOptions {
  const resolvedUrls = urls?.filter((url) => url.trim().length > 0);
  const queueOptions: Record<string, unknown> = {
    durable: true,
  };

  if (deadLetterExchange) {
    queueOptions.deadLetterExchange = deadLetterExchange;
  }

  if (deadLetterRoutingKey) {
    queueOptions.deadLetterRoutingKey = deadLetterRoutingKey;
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
