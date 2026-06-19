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

// Health
export { HealthController } from "./health/health.controller";
export { HealthModule } from "./health/health.module";

// Logger
export * from "./logger";

// Metrics
export { MetricsModule } from "./metrics/metrics.module";

// Sentry
export { SentryModule } from "./sentry/sentry.module";

// Tracing
export { startTracing } from './tracing';

// Messaging
export { EventBus, EventBusModule } from './messaging/event-bus';
