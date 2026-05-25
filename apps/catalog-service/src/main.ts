import './tracing';
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
    rawBody: true,
  });

  // Use Pino Logger globally
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

  // Trust proxy
  app.set('trust proxy', 1);

  const configService = app.get(ConfigService);
  const rabbitmqUrl = configService.get<string>('RABBITMQ_URL');

  // Connect to RabbitMQ to listen for Saga Events (e.g. STOCK_RESERVED, ORDER_CANCELLED)
  if (rabbitmqUrl && rabbitmqUrl !== 'false') {
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
      options: {
        urls: [rabbitmqUrl],
        queue: 'catalog_queue',
        queueOptions: {
          durable: true,
        },
      },
    });

    // Start microservices in the background so we don't block the HTTP server
    app
      .startAllMicroservices()
      .then(() => {
        console.log('Connected to RabbitMQ — catalog_queue active');
      })
      .catch((err) => {
        console.warn(
          `[WARN] RabbitMQ unavailable (${(err as Error).message}). ` +
            `Running without event queue. Start RabbitMQ to enable saga events.`,
        );
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
