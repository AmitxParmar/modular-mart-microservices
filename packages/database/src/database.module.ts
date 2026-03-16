import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

/**
 * Shared DatabaseModule.
 * Import this into your service's AppModule to automatically connect to
 * the PostgreSQL database specified by the standard DATABASE_URL env var.
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        url: process.env.DATABASE_URL as string,
        autoLoadEntities: true, // Automatically load entities registered in forFeature()
        // Never use synchronize: true in production. We will use migrations instead.
        synchronize: false,
        logging: process.env.NODE_ENV === 'development',
      }),
    }),
  ],
})
export class DatabaseModule {}
