import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get configuration service
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3005);

  // Global Validation Pipe
  // - whitelist: strip properties that don't have decorators
  // - forbidNonWhitelisted: throw error if non-whitelisted properties are present
  // - transform: auto-transform payloads to DTO instances
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable CORS for frontend integration
  app.enableCors();

  await app.listen(port);
  console.log(`🚀 Notification Service is running on: http://localhost:${port}`);
}

void bootstrap();
