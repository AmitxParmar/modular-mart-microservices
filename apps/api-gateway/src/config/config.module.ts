import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { appConfig, rateLimitConfig, servicesConfig } from './env.config';
import { validateEnv } from './env.schema';

/**
 * Global ConfigModule.
 * - `validate` runs Zod on raw process.env at startup; exits on failure
 * - `cache: true` memoises ConfigService.get() calls for performance
 * - `isGlobal: true` removes the need to re-import in every module
 */
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
      load: [appConfig, rateLimitConfig, servicesConfig],
    }),
  ],
})
export class ConfigModule {}
