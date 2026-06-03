import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(3005),
  DATABASE_URL: z.string().url(),
  
  // RabbitMQ
  RABBITMQ_URL: z.string().url(),
  RABBITMQ_EXCHANGE: z.string().default('mart.events'),

  // Email (Nodemailer)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().default('Modular Mart <noreply@modularmart.com>'),

  // SMS (Twilio)
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),

  // Push (FCM)
  FCM_SERVER_KEY: z.string().optional(),

  // Observability
  JAEGER_ENDPOINT: z.string().url().optional().or(z.literal('')),
  SENTRY_DSN: z.string().url().optional().or(z.literal('')),

  // Clerk
  CLERK_SECRET_KEY: z.string().min(1),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>) {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    console.error(
      '❌ Invalid environment variables:',
      JSON.stringify(result.error.format(), null, 2),
    );
    throw new Error('Invalid environment variables');
  }

  return result.data;
}
