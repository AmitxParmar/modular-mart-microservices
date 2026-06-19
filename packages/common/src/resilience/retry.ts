import { firstValueFrom, timeout, TimeoutError } from 'rxjs';
import { TransientError, classifyError } from './errors';

/**
 * Exponential backoff retry for async functions.
 *
 * Retries ONLY on TransientError. Business / Permanent errors are rethrown
 * immediately without consuming retry budget.
 *
 * Backoff sequence (default): 1s → 2s → 4s
 *
 * @param fn          Async factory that returns a Promise.
 * @param options.attempts   Max total attempts (including first). Default: 3.
 * @param options.baseDelayMs  Initial delay in ms. Default: 1000.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { attempts?: number; baseDelayMs?: number } = {},
): Promise<T> {
  const { attempts = 3, baseDelayMs = 1000 } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const classified = classifyError(err);

      // Business / Permanent errors: bail immediately, no retry
      if (!(classified instanceof TransientError)) {
        throw err;
      }

      lastError = err;

      if (attempt === attempts) break;

      const delayMs = baseDelayMs * Math.pow(2, attempt - 1);
      await sleep(delayMs);
    }
  }

  throw lastError;
}

/**
 * Wraps an RxJS Observable (e.g. from client.send()) in a firstValueFrom + timeout.
 * Returns a Promise that rejects with a TransientError on timeout.
 *
 * @param observable   The Observable to resolve.
 * @param timeoutMs    Milliseconds before a TimeoutError is thrown. Default: 5000.
 */
export async function resolveWithTimeout<T>(
  observable: Parameters<typeof firstValueFrom>[0],
  timeoutMs = 5000,
): Promise<T> {
  try {
    return await firstValueFrom(
      (observable as any).pipe(timeout(timeoutMs)),
    ) as T;
  } catch (err: unknown) {
    if (err instanceof TimeoutError) {
      throw new TransientError(
        `Request timed out after ${timeoutMs}ms`,
        err,
      );
    }
    throw err;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
