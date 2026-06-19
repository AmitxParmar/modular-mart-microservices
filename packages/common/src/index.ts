/**
 * Barrel export for @repo/common
 * All services import from this single entry point.
 */

// Filters
export { HttpExceptionFilter } from "./filters/http-exception.filter";
export type { ErrorResponse } from "./filters/http-exception.filter";

// Middlewares
export { CorrelationMiddleware } from "./middlewares/correlation.middleware";
export { ServiceTrustMiddleware } from "./middlewares/service-trust.middleware";

// Guards
export { InternalOnlyGuard } from "./guards/internal-only.guard";

// Health
export { HealthController } from "./health/health.controller";
export { HealthModule } from "./health/health.module";

// Logger
export * from "./logger";

// Metrics
export { MetricsModule } from "./metrics/metrics.module";
export { BusinessMetricsService } from "./metrics/business-metrics.service";

// Sentry
export { SentryModule } from "./sentry/sentry.module";

// Tracing
export { startTracing } from './tracing';

// Messaging
export { EventBus, EventBusModule } from './messaging/event-bus';
export { ServiceClient } from './messaging/service-client';

// Resilience
export { ResilienceModule } from './resilience/resilience.module';
export { CircuitBreakerService } from './resilience/circuit-breaker.service';
export { TransientError, PermanentError, BusinessError, classifyError } from './resilience/errors';
export { withRetry, resolveWithTimeout } from './resilience/retry';
