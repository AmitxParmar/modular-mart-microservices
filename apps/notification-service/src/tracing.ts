import { startTracing } from '@repo/common';

/**
 * Initializes distributed tracing for the Notification Service.
 * This must be imported at the very top of main.ts to ensure all 
 * outgoing requests and incoming events are captured.
 */
startTracing('notification-service');
