import { IncomingMessage } from 'http';
import { randomUUID } from 'crypto';
import { trace, context } from '@opentelemetry/api';

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
  return randomUUID();
}

/**
 * OpenTelemetry tracing utilities.
 */
export const traceUtils = {
  /**
   * Extracts traceId and spanId from the current active span.
   */
  getTraceContext: () => {
    const span = trace.getSpan(context.active());
    if (!span) return {};
    
    const spanContext = span.spanContext();
    return {
      traceId: spanContext.traceId,
      spanId: spanContext.spanId,
      traceFlags: spanContext.traceFlags,
    };
  },
};
