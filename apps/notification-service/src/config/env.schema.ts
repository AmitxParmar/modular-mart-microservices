import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(3005),
  DATABASE_URL: z.url(),
  
  // RabbitMQ
  RABBITMQ_URL: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.url().default('amqp://localhost:5672'),
  ),

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
  JAEGER_ENDPOINT: z.url().optional().or(z.literal('')),
  SENTRY_DSN: z.url().optional().or(z.literal('')),

  // Clerk
  CLERK_SECRET_KEY: z.string().min(1),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>) {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    console.error(
      '❌ Invalid environment variables:',
      JSON.stringify(z.treeifyError(result.error), null, 2),
    );
    throw new Error('Invalid environment variables');
  }

  return result.data;
}
