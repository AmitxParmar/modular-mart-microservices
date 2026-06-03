/**
 * Delivery priority for notifications.
 * Used to route messages to different queues.
 */
export enum NotificationPriority {
  // CRITICAL: Immediate action required (e.g., Payment Failure)
  CRITICAL = 'CRITICAL',
  
  // HIGH: Important transactional notifications (e.g., Order Confirmation)
  HIGH = 'HIGH',
  
  // BULK: Low priority, marketing or background alerts (e.g., Newsletters)
  BULK = 'BULK',
}
