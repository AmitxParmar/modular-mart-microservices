/**
 * Barrel export for @repo/common
 * All services import from this single entry point.
 */

// Filters
export { HttpExceptionFilter } from "./filters/http-exception.filter";
export type { ErrorResponse } from "./filters/http-exception.filter";

// Middlewares
export { CorrelationMiddleware } from "./middlewares/correlation.middleware";

// Health
export { HealthController } from "./health/health.controller";
export { HealthModule } from "./health/health.module";

// Logger
export { createLoggerConfig } from "./logger/logger.config";
export { PinoLogger, InjectPinoLogger } from "nestjs-pino";
