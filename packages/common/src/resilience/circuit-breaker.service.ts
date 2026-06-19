import { Injectable, Logger } from '@nestjs/common';
import { Counter, Gauge } from 'prom-client';
import { TransientError, classifyError } from './errors';

/** Milliseconds the breaker stays OPEN before transitioning to HALF_OPEN. */
const DEFAULT_RESET_TIMEOUT_MS = 30_000;
/** Number of consecutive TransientErrors before the breaker opens. */
const DEFAULT_FAILURE_THRESHOLD = 5;
/** Number of consecutive successes in HALF_OPEN before closing. */
const DEFAULT_SUCCESS_THRESHOLD = 3;

type BreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface BreakerStats {
  state: BreakerState;
  failures: number;
  successes: number;
  lastFailureAt: number | null;
}

/**
 * CircuitBreakerService
 *
 * One instance per process; manages a breaker per named dependency.
 * Use `execute(name, fn)` instead of calling client.send() directly.
 *
 * State machine:
 *   CLOSED   — normal operation, counts failures
 *   OPEN     — rejects all calls immediately after failureThreshold reached
 *   HALF_OPEN — lets one probe call through after resetTimeout elapses
 *
 * Prometheus metrics exposed:
 *   circuit_breaker_state{service}       — 0=CLOSED, 1=HALF_OPEN, 2=OPEN
 *   circuit_breaker_open_total{service}  — times the breaker has tripped
 *   circuit_breaker_failures_total{service}
 *   circuit_breaker_recovered_total{service}
 */
@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private readonly breakers = new Map<string, BreakerStats>();

  private readonly stateGauge: Gauge<string>;
  private readonly openCounter: Counter<string>;
  private readonly failureCounter: Counter<string>;
  private readonly recoveredCounter: Counter<string>;

  constructor() {
    this.stateGauge = new Gauge({
      name: 'circuit_breaker_state',
      help: 'Current circuit breaker state: 0=CLOSED, 1=HALF_OPEN, 2=OPEN',
      labelNames: ['service'],
    });

    this.openCounter = new Counter({
      name: 'circuit_breaker_open_total',
      help: 'Total times a circuit breaker has opened',
      labelNames: ['service'],
    });

    this.failureCounter = new Counter({
      name: 'circuit_breaker_failures_total',
      help: 'Total transient failures counted by circuit breakers',
      labelNames: ['service'],
    });

    this.recoveredCounter = new Counter({
      name: 'circuit_breaker_recovered_total',
      help: 'Total times a circuit breaker has recovered (HALF_OPEN → CLOSED)',
      labelNames: ['service'],
    });
  }

  /**
   * Execute `fn` through the circuit breaker for `serviceName`.
   * Throws immediately when the breaker is OPEN.
   * Only TransientErrors count toward the failure threshold.
   */
  async execute<T>(serviceName: string, fn: () => Promise<T>): Promise<T> {
    const stats = this.getOrCreate(serviceName);

    if (stats.state === 'OPEN') {
      if (this.shouldAttemptReset(stats)) {
        this.transition(serviceName, stats, 'HALF_OPEN');
      } else {
        throw new TransientError(
          `Circuit breaker OPEN for "${serviceName}". Requests blocked.`,
        );
      }
    }

    try {
      const result = await fn();
      this.onSuccess(serviceName, stats);
      return result;
    } catch (err: unknown) {
      const classified = classifyError(err);

      if (classified instanceof TransientError) {
        this.onFailure(serviceName, stats, classified.message);
      }

      // Re-throw the original error so callers see the real reason
      throw err;
    }
  }

  // ─── State management ────────────────────────────────────────────────────

  private getOrCreate(serviceName: string): BreakerStats {
    if (!this.breakers.has(serviceName)) {
      this.breakers.set(serviceName, {
        state: 'CLOSED',
        failures: 0,
        successes: 0,
        lastFailureAt: null,
      });
      this.stateGauge.set({ service: serviceName }, 0);
    }
    return this.breakers.get(serviceName)!;
  }

  private onSuccess(serviceName: string, stats: BreakerStats): void {
    if (stats.state === 'HALF_OPEN') {
      stats.successes += 1;
      if (stats.successes >= DEFAULT_SUCCESS_THRESHOLD) {
        this.transition(serviceName, stats, 'CLOSED');
        this.recoveredCounter.inc({ service: serviceName });
        this.logger.log(`[CircuitBreaker] "${serviceName}" recovered → CLOSED`);
      }
    } else {
      stats.failures = 0; // reset on success in CLOSED state
    }
  }

  private onFailure(serviceName: string, stats: BreakerStats, reason: string): void {
    stats.failures += 1;
    stats.lastFailureAt = Date.now();
    this.failureCounter.inc({ service: serviceName });

    if (stats.state === 'HALF_OPEN') {
      // Probe failed — back to OPEN
      this.transition(serviceName, stats, 'OPEN');
      this.logger.warn(
        `[CircuitBreaker] "${serviceName}" probe failed → OPEN again. Reason: ${reason}`,
      );
    } else if (stats.failures >= DEFAULT_FAILURE_THRESHOLD) {
      this.transition(serviceName, stats, 'OPEN');
      this.openCounter.inc({ service: serviceName });
      this.logger.error(
        `[CircuitBreaker] "${serviceName}" OPENED after ${stats.failures} failures. ` +
        `Will probe after ${DEFAULT_RESET_TIMEOUT_MS / 1000}s. Last error: ${reason}`,
      );
    }
  }

  private shouldAttemptReset(stats: BreakerStats): boolean {
    return (
      stats.lastFailureAt !== null &&
      Date.now() - stats.lastFailureAt >= DEFAULT_RESET_TIMEOUT_MS
    );
  }

  private transition(
    serviceName: string,
    stats: BreakerStats,
    newState: BreakerState,
  ): void {
    stats.state = newState;
    stats.successes = 0;
    if (newState === 'CLOSED') stats.failures = 0;

    const stateValue = { CLOSED: 0, HALF_OPEN: 1, OPEN: 2 }[newState];
    this.stateGauge.set({ service: serviceName }, stateValue);
  }

  /** Expose current state for health checks / debugging. */
  getState(serviceName: string): BreakerState {
    return this.breakers.get(serviceName)?.state ?? 'CLOSED';
  }
}
