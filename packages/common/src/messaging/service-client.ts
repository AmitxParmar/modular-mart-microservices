import { Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CircuitBreakerService } from '../resilience/circuit-breaker.service';
import { resolveWithTimeout, withRetry } from '../resilience/retry';

/** Default timeout for any service call. 10s to accommodate Render cold starts. */
const DEFAULT_TIMEOUT_MS = 10_000;
/** Default retry attempts. */
const DEFAULT_ATTEMPTS = 3;

/**
 * ServiceClient
 *
 * The single, canonical way to make RabbitMQ request-response calls.
 * Wraps every call with:
 *   1. Timeout          — prevents hanging on Render sleeping services
 *   2. Circuit Breaker  — stops cascading after repeated failures
 *   3. Retry            — exponential backoff for transient errors only
 *
 * Usage (in any service):
 *   const result = await this.serviceClient.send<ProductBatch>(
 *     'catalog-service',
 *     this.catalogClient,
 *     'products.get_batch',
 *     productIds,
 *   );
 *
 * Never call firstValueFrom(client.send(...)) directly.
 */
@Injectable()
export class ServiceClient {
  private readonly logger = new Logger(ServiceClient.name);

  constructor(private readonly circuitBreaker: CircuitBreakerService) {}

  async send<TResult>(
    /** Logical name of the dependency — used for circuit-breaker tracking and logging. */
    serviceName: string,
    /** The ClientProxy injected via @Inject('SERVICE_TOKEN'). */
    client: ClientProxy,
    /** RabbitMQ message pattern (cmd string or object). */
    pattern: string | Record<string, unknown>,
    /** Request payload. */
    payload: unknown,
    options: {
      timeoutMs?: number;
      retryAttempts?: number;
    } = {},
  ): Promise<TResult> {
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const attempts = options.retryAttempts ?? DEFAULT_ATTEMPTS;

    return this.circuitBreaker.execute(serviceName, () =>
      withRetry(
        () => {
          this.logger.debug(
            `[ServiceClient] → ${serviceName} | pattern=${JSON.stringify(pattern)}`,
          );
          return resolveWithTimeout<TResult>(
            client.send<TResult>(pattern, payload),
            timeoutMs,
          );
        },
        { attempts },
      ),
    );
  }
}
