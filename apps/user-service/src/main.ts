import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';

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

  // Use configured PORT or fallback
  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`User Service listening on port ${port}`);
}
bootstrap();
