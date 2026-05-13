import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    rawBody: true, // Required: captures raw bytes for Clerk webhook signature verification
  });

  // Use Pino Logger globally
  app.useLogger(app.get(Logger));

  // Security HTTP Headers
  app.use(helmet());

  // Global route prefix — gateway forwards /api/* paths as-is
  app.setGlobalPrefix('api', { exclude: ['health/(.*)'] });

  // Enable CORS

  app.enableCors({
    origin: '*', // API Gateway will usually call this internally, but useful for dev
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Trust proxy for correct client IP detection (behind API Gateway)
  app.set('trust proxy', 1);

  const configService = app.get(ConfigService);
  const rabbitmqUrl = configService.get<string>('RABBITMQ_URL') || 'amqp://localhost:5672';

  // Configure RabbitMQ Microservice for internal RBAC calls (from catalog-order-service, etc.)
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitmqUrl],
      queue: 'auth_queue',
      queueOptions: {
        durable: true,
      },
    },
  });

  await app.startAllMicroservices();

  // Use configured PORT or fallback from ConfigService
  const port = configService.get<number>('PORT', 3001);
  const tcpPort = configService.get<number>('TCP_PORT', 3011);

  await app.listen(port);
  const logger = app.get(Logger);
  logger.log(
    `User Service listening on HTTP port ${port} and TCP port ${tcpPort}`,
    'Bootstrap',
  );
}
void bootstrap();
