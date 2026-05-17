import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { validateEnv } from './env.schema';

@Module({
  imports: [
    NestConfigModule.forRoot({
      validate: validateEnv,
      isGlobal: true,
    }),
  ],
})
export class ConfigModule {}
