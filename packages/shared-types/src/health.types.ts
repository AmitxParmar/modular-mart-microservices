/**
 * Standard response format for health check endpoints (/health/live, /health/ready).
 * Used by Kong Gateway upstreams and Kubernetes/Render probes.
 */
export interface HealthResponse {
  /** Current status of the service */
  status: "healthy" | "unhealthy";
  /** ISO 8601 timestamp of the check */
  timestamp: string;
}
