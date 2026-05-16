import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(3004),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),
  DATABASE_URL: z
    .url()
    .default('postgresql://postgres:postgres@localhost:5432/payment_db'),
  RABBITMQ_URL: z.url().default('amqp://user:password@localhost:5672'),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  // URL of the order-service so payment can validate orders before creating intents
  ORDER_SERVICE_URL: z.url().default('http://localhost:3003'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>) {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(JSON.stringify(z.treeifyError(result.error), null, 2));
    throw new Error('Invalid environment variables');
  }

  return result.data;
}
