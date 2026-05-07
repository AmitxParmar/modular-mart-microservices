import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    rawBody: true, // Required: captures raw bytes for Clerk webhook signature verification
  });

  // Use Pino Logger globally
  app.useLogger(app.get(Logger));

  // Security HTTP Headers
  app.use(helmet());

  // Enable CORS
  app.enableCors({
    origin: '*', // API Gateway will usually call this internally, but useful for dev
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Trust proxy for correct client IP detection (behind API Gateway)
  app.set('trust proxy', 1);

  // Configure RabbitMQ Microservice for internal RBAC calls (from catalog-order-service, etc.)
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
      queue: 'auth_queue',
      queueOptions: {
        durable: true,
      },
    },
  });

  await app.startAllMicroservices();

  // Use configured PORT or fallback
  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(
    `User Service listening on HTTP port ${port} and TCP port ${process.env.TCP_PORT || 3011}`,
  );
}
bootstrap();
