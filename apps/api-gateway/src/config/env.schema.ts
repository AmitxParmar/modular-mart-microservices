import { z } from 'zod';

/**
 * Zod schema for all environment variables used by the API Gateway.
 * The gateway will FAIL FAST at startup if any required var is missing
 * or fails its type/value constraint — preventing silent misconfigurations
 * in staging/production.
 */
export const EnvSchema = z.object({
  // ── App ─────────────────────────────────────────────────────────────────
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(8000),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),

  // ── CORS ─────────────────────────────────────────────────────────────────
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),

  // ── Rate Limiting ────────────────────────────────────────────────────────
  RATE_LIMIT_TTL: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),

  // ── Downstream Services ──────────────────────────────────────────────────
  // All service URLs are required in non-dev environments.
  USER_SERVICE_URL: z.url().default('http://localhost:3001'),
  PRODUCT_SERVICE_URL: z.url().default('http://localhost:3002'),
  ORDER_SERVICE_URL: z.url().default('http://localhost:3003'),
  PAYMENT_SERVICE_URL: z.url().default('http://localhost:3004'),
  CART_SERVICE_URL: z.url().default('http://localhost:3005'),
});

export type Env = z.infer<typeof EnvSchema>;

/**
 * Validates the raw process.env object against the Zod schema.
 * Used as the `validate` option inside ConfigModule.forRoot().
 *
 * @throws {Error} with a formatted message listing every validation failure.
 */
export function validateEnv(config: Record<string, unknown>): Env {
  const result = EnvSchema.safeParse(config);

  if (!result.success) {
    const messages = result.error.issues
      .map((e) => `  [${e.path.join('.')}] ${e.message}`)
      .join('\n');

    throw new Error(
      `❌ Invalid environment configuration:\n${messages}\n\nFix the above errors before starting the gateway.`,
    );
  }

  return result.data;
}
