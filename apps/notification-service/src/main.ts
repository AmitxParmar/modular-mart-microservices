import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger as NestLogger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';

/**
 * Entry point for the Notification Service.
 * Configures the application as a "Hybrid App" (HTTP + RabbitMQ Microservice).
 */
async function bootstrap() {
  const logger = new NestLogger('Bootstrap');
  
  // 1. Create the main NestJS application (HTTP)
  const app = await NestFactory.create(AppModule);

  // 2. Load configuration
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3005);
  const rabbitmqUrl = configService.get<string>('RABBITMQ_URL');

  // 3. Global Middleware & Pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableCors();

  // 4. Configure RabbitMQ Microservice Listeners (Priority Queues)
  // We connect to multiple queues to support different processing priorities.
  
  if (rabbitmqUrl) {
    // --- Queue: Critical Notifications (e.g. Payment Failures) ---
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
      options: {
        urls: [rabbitmqUrl],
        queue: 'notifications.critical',
        queueOptions: { durable: true },
        prefetchCount: 1, // Process one at a time for high reliability
      },
    });

    // --- Queue: High Priority Notifications (e.g. Order Created) ---
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
      options: {
        urls: [rabbitmqUrl],
        queue: 'notifications.high',
        queueOptions: { durable: true },
        prefetchCount: 5, // Balanced concurrency
      },
    });

    // --- Queue: Bulk Notifications (e.g. Welcome Emails, Newsletters) ---
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
      options: {
        urls: [rabbitmqUrl],
        queue: 'notifications.bulk',
        queueOptions: { durable: true },
        prefetchCount: 20, // High concurrency for non-urgent tasks
      },
    });

    // 5. Start all connected microservices
    await app.startAllMicroservices();
    logger.log('📡 RabbitMQ Priority Queues connected and listening');
  }

  // 6. Start the HTTP server
  await app.listen(port);
  logger.log(`🚀 Notification Service is running on: http://localhost:${port}`);
}

void bootstrap();
