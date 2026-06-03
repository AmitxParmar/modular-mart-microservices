import './tracing';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@repo/common';
import {
  createRmqOptions,
  startAllMicroservicesWithRetry,
} from '@repo/common/messaging';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    rawBody: true, // Required for Stripe webhook signature verification
  });

  app.useLogger(app.get(Logger));
  app.use(helmet());

  // Global prefix — gateway forwards /api/* paths as-is
  app.setGlobalPrefix('api', { exclude: ['health/(.*)', 'metrics'] });

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.set('trust proxy', 1);

  const configService = app.get(ConfigService);
  const rabbitmqUrl = configService.get<string>('RABBITMQ_URL');

  /**
   * Connect to RabbitMQ as a microservice consumer.
   * payment-service listens on 'payments_queue' for:
   *   - order.created  → (optional) pre-create pending payment record
   *
   * It PUBLISHES payment.succeeded / payment.failed to the exchange,
   * which other services (order-service) subscribe to.
   *
   * Concept: Hybrid NestJS app — HTTP server + RabbitMQ consumer in one process.
   */
  if (rabbitmqUrl && rabbitmqUrl !== 'false') {
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
      options: createRmqOptions({
        urls: [rabbitmqUrl],
        queue: 'payments_queue',
        deadLetterExchange: 'dlx_exchange',
        deadLetterRoutingKey: 'dlq_payments_queue',
      }),
    });

    // Dead-letter queue consumer
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
      options: createRmqOptions({
        urls: [rabbitmqUrl],
        queue: 'dlq_payments_queue',
      }),
    });

    void startAllMicroservicesWithRetry(() => app.startAllMicroservices(), {
      logger: console,
      serviceName: 'payment-service',
    });
  } else {
    console.warn(
      '[WARN] RabbitMQ disabled via environment. Running HTTP-only mode.',
    );
  }

  const port = configService.get<number>('PORT', 3004);
  await app.listen(port);
  console.log(`💳 Payment Service listening on port ${port}`);
}

void bootstrap();
