import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { validateEnv } from './env.schema';

@Module({
  imports: [
    NestConfigModule.forRoot({
      validate: validateEnv,
      isGlobal: true, // Make configuration available globally
      expandVariables: true, // Allow ${VAR} syntax in .env
    }),
  ],
})
export class ConfigModule {}
