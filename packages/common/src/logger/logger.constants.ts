/**
 * List of sensitive fields that should be redacted from logs.
 */
export const SENSITIVE_FIELDS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.body.password',
  'req.body.token',
  'req.body.accessToken',
  'req.body.refreshToken',
  'req.body.cardNumber',
  'req.body.cvc',
  'req.body.pin',
  'res.headers["set-cookie"]',
];

/**
 * Default redaction label.
 */
export const REDACTION_LABEL = '[REDACTED]';

/**
 * Health check endpoint path to ignore in logs.
 */
export const HEALTH_CHECK_PATH = '/health';
