import './tracing';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  Logger,
  HttpExceptionFilter,
  createRmqOptions,
  startAllMicroservicesWithRetry,
} from '@repo/common';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    rawBody: true,
  });

  // Use Pino Logger globally
  app.useLogger(app.get(Logger));

  // Global Exception Filter
  app.useGlobalFilters(new HttpExceptionFilter());

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

  // Trust proxy
  app.set('trust proxy', 1);

  const configService = app.get(ConfigService);
  const rabbitmqUrl = configService.get<string>('RABBITMQ_URL');

  // Connect to RabbitMQ to listen for Saga Events (e.g. STOCK_RESERVED, ORDER_CANCELLED)
  if (rabbitmqUrl && rabbitmqUrl !== 'false') {
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
      options: createRmqOptions({
        urls: [rabbitmqUrl],
        queue: 'catalog_queue',
        deadLetterExchange: 'dlx_exchange',
        deadLetterRoutingKey: 'dlq_catalog_queue',
      }),
    });

    // Dead-letter queue consumer
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
      options: createRmqOptions({
        urls: [rabbitmqUrl],
        queue: 'dlq_catalog_queue',
      }),
    });

    void startAllMicroservicesWithRetry(() => app.startAllMicroservices(), {
      logger: console,
      serviceName: 'catalog-service',
    });
  } else {
    console.warn(
      '[WARN] RabbitMQ connection disabled via environment configuration.',
    );
  }

  const port = configService.get<number>('PORT', 3005);
  await app.listen(port);
  console.log(`Catalog Service listening on port ${port}`);
}
void bootstrap();
