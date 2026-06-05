/**
 * Standard metadata attached to every domain event.
 * Vital for tracing and causality in an event-driven architecture.
 */
export interface EventMetadata {
  /** The correlation ID that triggered this event */
  requestId: string;
  /** ISO 8601 timestamp of when the event occurred */
  timestamp: string;
  /** The name of the service that emitted the event */
  source: string;
}

/**
 * Sample event structure for order creation.
 */
export interface OrderCreatedEvent {
  /** Event-specific metadata */
  metadata: EventMetadata;
  /** The actual domain data */
  data: {
    /** UUID of the newly created order */
    orderId: string;
    /** The user who placed the order */
    userId: string;
  };
}
