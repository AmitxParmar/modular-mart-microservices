/**
 * Types of notifications supported by the system.
 * These correspond to business events.
 */
export enum NotificationType {
  // Order related
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  ORDER_SHIPPED = 'ORDER_SHIPPED',
  
  // Payment related
  PAYMENT_SUCCEEDED = 'PAYMENT_SUCCEEDED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  
  // Catalog related
  STOCK_LOW = 'STOCK_LOW',
  PRICE_CHANGED = 'PRICE_CHANGED',
  
  // User related
  USER_REGISTERED = 'USER_REGISTERED',
  SECURITY_ALERT = 'SECURITY_ALERT',
  
  // General
  NEWSLETTER = 'NEWSLETTER',
  PROMOTIONAL = 'PROMOTIONAL',
}
