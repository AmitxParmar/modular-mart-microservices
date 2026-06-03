import './tracing';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger as NestLogger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { Logger, HttpExceptionFilter } from '@repo/common';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

/**
 * Entry point for the Notification Service.
 * Configures the application as a "Hybrid App" (HTTP + RabbitMQ Microservice).
 */
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // Suppress NestJS's built-in logger during boot; Pino takes over after.
    bufferLogs: true,
  });

  // 1. Structured logging (Pino)
  // Replaces the default NestJS logger with our high-performance Pino logger.
  app.useLogger(app.get(Logger));

  // 2. Global Exception Filter
  // Ensures all errors are returned in a consistent JSON format.
  app.useGlobalFilters(new HttpExceptionFilter());

  // 3. Security
  app.use(helmet());

  // 4. Global route prefix — gateway forwards /api/* paths as-is
  // We exclude health and metrics from the prefix for monitoring tools.
  app.setGlobalPrefix('api', { exclude: ['health/:path*', 'metrics'] });

  // 5. Load configuration
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3005);
  const rabbitmqUrl = configService.get<string>('RABBITMQ_URL');

  // 6. Global Pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 7. CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // 8. Trust Proxy
  // Essential for reading the correct client IP when behind a load balancer (Render).
  app.set('trust proxy', 1);

  // 9. Configure RabbitMQ Microservice Listeners (Priority Queues)
  if (rabbitmqUrl) {
    const queues = [
      { name: 'notifications.critical', prefetch: 1 },
      { name: 'notifications.high', prefetch: 5 },
      { name: 'notifications.bulk', prefetch: 20 },
    ];

    for (const queue of queues) {
      app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.RMQ,
        options: {
          urls: [rabbitmqUrl],
          queue: queue.name,
          queueOptions: { 
            durable: true,
            deadLetterExchange: 'dlx_exchange',
            deadLetterRoutingKey: `dlq_${queue.name}`,
          },
          prefetchCount: queue.prefetch,
        },
      });

      // Connect Dead Letter Queue consumers to prevent message loss
      app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.RMQ,
        options: {
          urls: [rabbitmqUrl],
          queue: `dlq_${queue.name}`,
          queueOptions: { durable: true },
        },
      });
    }

    // Start all connected microservices
    await app.startAllMicroservices();
    const logger = new NestLogger('Bootstrap');
    logger.log('📡 RabbitMQ Priority Queues connected and listening');
  }

  // 10. Start the HTTP server
  await app.listen(port);
  const logger = new NestLogger('Bootstrap');
  logger.log(`🚀 Notification Service is running on: http://localhost:${port}`);
  
  // 11. Graceful Shutdown
  app.enableShutdownHooks();
}

void bootstrap();
