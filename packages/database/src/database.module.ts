import { Module, DynamicModule, Global } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

export interface DatabaseModuleOptions {
  /**
   * Optional override for the database URL. If not provided,
   * the module will read DATABASE_URL from the environment via ConfigService.
   */
  url?: string;
}

/**
 * Shared DatabaseModule – now a Dynamic Module.
 *
 * Why dynamic?
 * Because each service in this monorepo manages its own isolated PostgreSQL cluster.
 * A single static connection module with a hardcoded DATABASE_URL doesn’t work.
 * Instead, each service imports `DatabaseModule.forRoot()` and passes its own
 * connection details, either via environment variables or an explicit options object.
 *
 * This centralises the recurring TypeORM connection setup:
 * - SSL configuration (uses dedicated DATABASE_SSL env var, not fragile URL parsing)
 * - synchronize / logging toggles based on NODE_ENV
 * - auto-loading of entities
 * - future pool settings, retry strategies, and migration aids can be added here
 */
@Global()
@Module({})
export class DatabaseModule {
  static forRoot(options?: DatabaseModuleOptions): DynamicModule {
    return {
      module: DatabaseModule,
      global: true,
      imports: [
        TypeOrmModule.forRootAsync({
          // Make ConfigModule available for ConfigService injection
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService): TypeOrmModuleOptions => {
            const url = options?.url ?? config.get<string>('DATABASE_URL');
            const nodeEnv = config.get<string>('NODE_ENV');
            const sslConfig = config.get<string | boolean>('DATABASE_SSL');
            const sslEnabled = sslConfig === true || sslConfig === 'true';

            return {
              type: 'postgres',
              url,
              autoLoadEntities: true,

              // SSL configuration:
              // Use a dedicated DATABASE_SSL variable instead of parsing the URL.
              // This avoids fragile string-matching and makes the intent explicit.
              // In production, set DATABASE_SSL=true and provide a CA certificate
              // via the `ssl.ca` property for secure connections.
              // For local/CI environments with self-signed certs, you may set
              // rejectUnauthorized: false (not recommended for production).
              ssl: sslEnabled
                ? { rejectUnauthorized: false } // TODO: replace with proper CA in production
                : false,

              // Never use synchronize: true in production; rely on migrations.
              synchronize: nodeEnv !== 'production',

              // Log SQL queries only in development for debugging.
              logging: nodeEnv === 'development',
            };
          },
        }),
      ],
      exports: [TypeOrmModule],
    };
  }
}