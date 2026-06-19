/**
 * Resilience Error Taxonomy
 *
 * Circuit breaker and retry logic use these classes to decide how to respond:
 *
 *   TransientError  → retry + counts toward circuit breaker
 *   PermanentError  → do NOT retry, do NOT trip the circuit breaker
 *   BusinessError   → do NOT retry, do NOT trip the circuit breaker
 *
 * Rule: Only wrap errors that represent infrastructure/network faults as
 * TransientError. Business-level rejections (ProductNotFound, InsufficientStock)
 * must stay as BusinessError so they don't cascade into circuit-breaker trips.
 */

/** Network blip, timeout, 503, 429 — safe to retry, counts as a failure. */
export class TransientError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'TransientError';
  }
}

/** Misconfiguration or hard crash — do not retry, do not trip the breaker. */
export class PermanentError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'PermanentError';
  }
}

/** Validation / domain rejection — never retry, never trip the breaker. */
export class BusinessError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'BusinessError';
  }
}

/**
 * Classifies a raw error from a client.send() call into the taxonomy above.
 * This is the single place that maps HTTP status codes / error names to
 * resilience categories. Update here; never scatter conditionals in callers.
 */
export function classifyError(err: unknown): TransientError | PermanentError | BusinessError {
  if (
    err instanceof TransientError ||
    err instanceof PermanentError ||
    err instanceof BusinessError
  ) {
    return err;
  }

  const message = err instanceof Error ? err.message : String(err);
  const name = err instanceof Error ? err.name : '';

  // Timeout errors (from rxjs timeout() or our own)
  if (name === 'TimeoutError' || message.toLowerCase().includes('timeout')) {
    return new TransientError(`Timeout: ${message}`, err);
  }

  // Network errors
  if (
    message.includes('ECONNREFUSED') ||
    message.includes('ECONNRESET') ||
    message.includes('ENOTFOUND') ||
    message.includes('socket hang up') ||
    message.includes('connect ETIMEDOUT')
  ) {
    return new TransientError(`Network error: ${message}`, err);
  }

  // RPC-level status codes forwarded from NestJS microservices
  const status = (err as any)?.status ?? (err as any)?.statusCode;
  if (status === 503 || status === 429 || status === 502 || status === 504) {
    return new TransientError(`Service unavailable (${status}): ${message}`, err);
  }

  // Business / validation errors — never retry
  if (status === 404 || status === 422 || status === 400 || status === 409) {
    return new BusinessError(`Business error (${status}): ${message}`, err);
  }

  // Auth errors — permanent (retrying won't help)
  if (status === 401 || status === 403) {
    return new PermanentError(`Auth error (${status}): ${message}`, err);
  }

  // Unknown — treat as transient so we don't silently swallow failures
  return new TransientError(`Unknown error: ${message}`, err);
}
