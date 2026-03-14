import { registerAs } from '@nestjs/config';

/**
 * Namespaced configuration factories.
 * These allow type-safe access via ConfigService:
 *   configService.get<number>('app.port')
 *   configService.get<string>('services.userService')
 *
 * Values are already coerced and validated by Zod (see env.schema.ts),
 * so parseInt / string fallbacks here are just TypeScript safety nets.
 */
export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  logLevel: process.env.LOG_LEVEL ?? 'info',
}));

export const rateLimitConfig = registerAs('rateLimit', () => ({
  ttl: parseInt(process.env.RATE_LIMIT_TTL ?? '60000', 10),
  limit: parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10),
}));

export const servicesConfig = registerAs('services', () => ({
  userService: process.env.USER_SERVICE_URL ?? 'http://localhost:3001',
  productService: process.env.PRODUCT_SERVICE_URL ?? 'http://localhost:3002',
  orderService: process.env.ORDER_SERVICE_URL ?? 'http://localhost:3003',
  paymentService: process.env.PAYMENT_SERVICE_URL ?? 'http://localhost:3004',
  cartService: process.env.CART_SERVICE_URL ?? 'http://localhost:3005',
}));
