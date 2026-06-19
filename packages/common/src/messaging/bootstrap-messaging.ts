import { INestApplication } from '@nestjs/common';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { createRmqOptions, startAllMicroservicesWithRetry } from './rmq-options';

// ─── Queue name helpers (single source of truth) ──────────────────────────────

export type ServiceName =
  | 'catalog'
  | 'order'
  | 'payment'
  | 'user'
  | 'notification';

/** Main consumer queue for a service: e.g. 'catalog.events' */
export function getQueueName(service: ServiceName): string {
  return `${service}.events`;
}

/** Dead-letter queue for a service: e.g. 'catalog.dlq' */
export function getDlqName(service: ServiceName): string {
  return `${service}.dlq`;
}

/** First retry queue (TTL 5 s): e.g. 'catalog.retry1' */
export function getRetry1QueueName(service: ServiceName): string {
  return `${service}.retry1`;
}

/** Second retry queue (TTL 30 s): e.g. 'catalog.retry2' */
export function getRetry2QueueName(service: ServiceName): string {
  return `${service}.retry2`;
}

// ─── Bootstrap helper ─────────────────────────────────────────────────────────

interface BootstrapMessagingOptions {
  /**
   * The logical service name used for queue derivation and logging.
   * e.g. 'catalog' → consumes from 'catalog.events'
   */
  service: ServiceName;
  rabbitmqUrl: string;
  logger?: {
    log(message: string): void;
    warn(message: string): void;
    error(message: string, trace?: string): void;
  };
}

/**
 * bootstrapMessaging — standard RabbitMQ bootstrap for every service.
 *
 * Replaces the per-service `connectMicroservice` boilerplate.  Each call:
 *  1. Connects one consumer to `<service>.events` (with DLX → retry1).
 *  2. Starts all microservices with retry logic.
 *
 * The retry queues (retry1 / retry2) are declared automatically by the
 * RabbitMQMessageHandler decorator's nack behaviour combined with the
 * broker-level TTL configuration set in createRmqOptions.
 *
 * @example
 *   await bootstrapMessaging(app, { service: 'catalog', rabbitmqUrl });
 */
export async function bootstrapMessaging(
  app: INestApplication,
  options: BootstrapMessagingOptions,
): Promise<void> {
  const { service, rabbitmqUrl, logger = console } = options;

  if (!rabbitmqUrl || rabbitmqUrl === 'false') {
    logger.warn(
      `[Messaging] RabbitMQ disabled for ${service}-service. Running HTTP-only mode.`,
    );
    return;
  }

  const mainQueue = getQueueName(service);
  const retry1Queue = getRetry1QueueName(service);

  // Primary consumer — on NACK routes to retry1 via DLX
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: createRmqOptions({
      urls: [rabbitmqUrl],
      queue: mainQueue,
      deadLetterExchange: '',          // default exchange (routes by routing key)
      deadLetterRoutingKey: retry1Queue,
    }),
  });

  void startAllMicroservicesWithRetry(() => app.startAllMicroservices(), {
    logger,
    serviceName: `${service}-service`,
  });
}
