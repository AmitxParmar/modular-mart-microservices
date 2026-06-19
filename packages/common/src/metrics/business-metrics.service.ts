import { Injectable } from '@nestjs/common';
import { Counter, Gauge, Histogram } from 'prom-client';

/**
 * BusinessMetricsService
 *
 * Centralises all domain-level Prometheus metrics.
 * Import via MetricsModule (which exports this service globally).
 *
 * Usage in any service:
 *   this.metrics.ordersCreated.inc();
 *   this.metrics.checkoutDuration.observe(elapsedMs / 1000);
 *
 * These metrics are what hiring managers and senior engineers look for —
 * they demonstrate you think about the system's business behaviour, not
 * just CPU and RAM.
 */
@Injectable()
export class BusinessMetricsService {
  // ─── Orders ────────────────────────────────────────────────────────────────

  readonly ordersCreatedTotal = new Counter({
    name: 'orders_created_total',
    help: 'Total number of orders successfully created',
    labelNames: ['sellerId'] as const,
  });

  readonly ordersFailedTotal = new Counter({
    name: 'orders_failed_total',
    help: 'Total number of order creation failures',
    labelNames: ['reason'] as const,
  });

  readonly sagaCompensationsTotal = new Counter({
    name: 'saga_compensation_total',
    help: 'Total number of saga compensation actions triggered (order cancellations from failures)',
    labelNames: ['trigger'] as const, // 'payment_failed' | 'stock_failed'
  });

  readonly checkoutDurationSeconds = new Histogram({
    name: 'checkout_duration_seconds',
    help: 'End-to-end checkout duration from order creation to PAYMENT_PENDING',
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
  });

  // ─── Stock ─────────────────────────────────────────────────────────────────

  readonly stockReservationFailuresTotal = new Counter({
    name: 'stock_reservation_failures_total',
    help: 'Total number of stock reservation failures',
    labelNames: ['reason'] as const,
  });

  // ─── Payments ──────────────────────────────────────────────────────────────

  readonly paymentSuccessTotal = new Counter({
    name: 'payment_success_total',
    help: 'Total number of successful payments',
    labelNames: ['currency'] as const,
  });

  readonly paymentFailureTotal = new Counter({
    name: 'payment_failure_total',
    help: 'Total number of failed payments',
    labelNames: ['reason'] as const,
  });

  // ─── DLQ ───────────────────────────────────────────────────────────────────

  readonly dlqMessagesTotal = new Counter({
    name: 'dlq_messages_total',
    help: 'Total number of messages routed to a Dead Letter Queue',
    labelNames: ['service', 'pattern'] as const,
  });

  // ─── Outbox ────────────────────────────────────────────────────────────────

  readonly outboxPendingEvents = new Counter({
    name: 'outbox_events_processed_total',
    help: 'Total outbox events successfully published to RabbitMQ',
  });

  readonly outboxFailedEvents = new Counter({
    name: 'outbox_events_failed_total',
    help: 'Total outbox events that failed to publish',
  });

  /**
   * Gauges are set by the outbox processor on every cycle.
   * Alert in Grafana if outbox_pending_events grows unbounded
   * or outbox_oldest_event_age_seconds exceeds your SLO threshold.
   */
  readonly outboxPendingGauge = new Gauge({
    name: 'outbox_pending_events',
    help: 'Number of unprocessed events currently sitting in the outbox table',
  });

  readonly outboxOldestEventAgeGauge = new Gauge({
    name: 'outbox_oldest_event_age_seconds',
    help: 'Age in seconds of the oldest unprocessed outbox event',
  });

  // ─── Service Calls ─────────────────────────────────────────────────────────

  readonly serviceCallDurationSeconds = new Histogram({
    name: 'service_call_duration_seconds',
    help: 'Duration of inter-service RabbitMQ request-response calls',
    labelNames: ['service', 'pattern', 'status'] as const,
    buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
  });
}
