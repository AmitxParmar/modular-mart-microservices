import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  // Use Pino Logger globally
  app.useLogger(app.get(Logger));

  // Security HTTP Headers
  app.use(helmet());

  // Enable CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Trust proxy
  app.set('trust proxy', 1);

  // Use configured PORT (defaulting to 3002)
  const port = process.env.PORT ?? 3002;
  await app.listen(port);
  console.log(`Catalog & Order Service listening on port ${port}`);
}
bootstrap();
