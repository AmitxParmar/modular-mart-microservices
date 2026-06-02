/**
 * Delivery status for a specific notification channel.
 */
export enum ChannelStatus {
  // Initial state, waiting for worker to process
  PENDING = 'PENDING',
  
  // Currently being handled by a delivery worker
  PROCESSING = 'PROCESSING',
  
  // Successfully delivered
  SENT = 'SENT',
  
  // Delivery failed, pending retry
  FAILED = 'FAILED',
  
  // In the process of retrying
  RETRYING = 'RETRYING',
  
  // Max retries exceeded, moved to DLQ
  EXHAUSTED = 'EXHAUSTED',
}
