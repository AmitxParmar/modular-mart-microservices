/**
 * Standard RequestContext used to track a request throughout the system.
 */
export interface RequestContext {
  /** Unique Correlation ID (typically X-Request-ID) */
  requestId: string;
}

/**
 * Distributed Tracing context, compatible with OpenTelemetry standards.
 */
export interface TraceContext {
  /** The correlation ID for logging and tracing */
  requestId: string;
  /** OpenTelemetry Trace ID */
  traceId?: string;
  /** OpenTelemetry Span ID */
  spanId?: string;
}

/**
 * Common application configuration structure for microservices.
 */
export interface AppConfig {
  /** The port the service listens on */
  port: number;
  /** Connection string for RabbitMQ broker */
  rabbitmqUrl: string;
  /** Connection string for Redis instance */
  redisUrl: string;
}

/**
 * Headers required for secure service-to-service internal communication.
 */
export interface InternalHeaders {
  /** Propagated correlation ID */
  "x-request-id": string;
  /** Identity of the calling service */
  "x-service-name": string;
}
