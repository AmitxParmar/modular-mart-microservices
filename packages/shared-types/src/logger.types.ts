/**
 * Structured context for logs to ensure consistency across the LGTM stack (Loki/Grafana).
 */
export interface LogContext {
  /** The correlation ID for the current request */
  requestId?: string;
  /** The authenticated user performing the action */
  userId?: string;
  /** The name of the service emitting the log */
  service: string;
}
