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
    rawBody: true, // Required for Stripe webhook signature verification
  });

  app.useLogger(app.get(Logger));
  app.use(helmet());

  // Global prefix — gateway forwards /api/* paths as-is
  app.setGlobalPrefix('api', { exclude: ['health/(.*)'] });

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
      options: {
        urls: [rabbitmqUrl],
        queue: 'payments_queue',
        queueOptions: {
          durable: true,
        },
      },
    });

    app
      .startAllMicroservices()
      .then(() => {
        console.log('✅ Connected to RabbitMQ — payments_queue active');
      })
      .catch((err) => {
        console.warn(
          `[WARN] RabbitMQ unavailable (${(err as Error).message}). ` +
            `HTTP server still running. Payments will work but events won't be consumed.`,
        );
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
