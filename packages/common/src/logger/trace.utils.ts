import { IncomingMessage } from 'http';

/**
 * Generates or preserves a request ID.
 * Priority:
 * 1. x-request-id header
 * 2. Generated UUID
 */
export function genReqId(req: IncomingMessage): string {
  const headerId = req.headers['x-request-id'];
  if (headerId) {
    return Array.isArray(headerId) ? headerId[0] : headerId;
  }
  return crypto.randomUUID();
}

/**
 * Future integration for OpenTelemetry or other tracing libraries.
 */
export const traceUtils = {
  // Placeholder for traceId/spanId extraction
  getTraceContext: () => ({}),
};
