import './tracing';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@repo/common';
import { bootstrapMessaging } from '@repo/common/messaging';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    rawBody: true,
  });

  // Use custom Logger from common package (mapped to Pino/OpenTelemetry)
  app.useLogger(app.get(Logger));

  // Security HTTP Headers
  app.use(helmet());

  // Global route prefix — gateway forwards /api/* paths as-is
  app.setGlobalPrefix('api', { exclude: ['health/(.*)', 'metrics'] });

  // Enable CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Trust proxy for correct client IP detection (behind API Gateway or Load Balancer)
  app.set('trust proxy', 1);

  const configService = app.get(ConfigService);
  const rabbitmqUrl = configService.get<string>('RABBITMQ_URL') ?? '';

  // Setup Messaging (RabbitMQ) with automatic reconnection
  await bootstrapMessaging(app, {
    service: 'order',
    rabbitmqUrl,
    logger: app.get(Logger),
  });

  const port = configService.get<number>('PORT', 3002);
  await app.listen(port);
  app.get(Logger).log(`Order Service listening on port ${port}`, 'Bootstrap');
}
void bootstrap();
