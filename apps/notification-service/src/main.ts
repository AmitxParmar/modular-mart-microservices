import 'reflect-metadata';
import './tracing';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger as NestLogger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger, HttpExceptionFilter } from '@repo/common';
import { bootstrapMessaging } from '@repo/common/messaging';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

/**
 * Entry point for the Notification Service.
 *
 * Consuming from a single 'notification.events' queue (replaces the old
 * notifications.critical / notifications.high / notifications.bulk split).
 * Priority is now expressed as a `priority` field in the event payload and
 * handled internally by the service's NotificationDispatchService.
 */
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  // Use custom Logger from common package (mapped to Pino/OpenTelemetry)
  app.useLogger(app.get(Logger));

  // Global exception filter for consistent error responses
  app.useGlobalFilters(new HttpExceptionFilter());

  // Security HTTP Headers
  app.use(helmet());

  // Global route prefix — gateway forwards /api/* paths as-is
  app.setGlobalPrefix('api', { exclude: ['health/*', 'metrics'] });

  // Input validation and transformation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Trust proxy
  app.set('trust proxy', 1);

  const configService = app.get(ConfigService);
  const rabbitmqUrl = configService.get<string>('RABBITMQ_URL') ?? '';

  // Single queue replaces 3 priority queues. Priority is now in the event payload.
  // Setup Messaging (RabbitMQ) with automatic reconnection
  await bootstrapMessaging(app, {
    service: 'notification',
    rabbitmqUrl,
    logger: new NestLogger('Bootstrap'),
  });

  const port = configService.get<number>('PORT', 3005);
  await app.listen(port);
  app.enableShutdownHooks();
  new NestLogger('Bootstrap').log(
    `Notification Service listening on port ${port}`,
  );
}
void bootstrap();
