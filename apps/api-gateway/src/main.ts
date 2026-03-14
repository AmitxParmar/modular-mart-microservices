import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // Suppress NestJS's built-in logger during boot; Pino takes over after.
    bufferLogs: true,
  });

  // ─── Structured logging (Pino) ─────────────────────────────────────────
  app.useLogger(app.get(Logger));

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port', 3000);
  const nodeEnv = configService.get<string>('app.nodeEnv', 'development');

  // ─── Trust Proxy ───────────────────────────────────────────────────────
  // CRITICAL for Docker Swarm / Kubernetes: the gateway runs behind an
  // ingress controller or load balancer that terminates TLS and forwards
  // requests. Without this, Express reads the proxy's IP as the client IP,
  // which breaks rate limiting (everyone shares one IP bucket).
  //
  // '1' trusts the first proxy hop (ingress/LB).
  // In multi-layer setups (e.g. CDN → LB → gateway) increase this value.
  app.set('trust proxy', 1);

  // ─── Security ──────────────────────────────────────────────────────────
  app.use(helmet());

  app.enableCors({
    // In prod, restrict to explicit origins via ALLOWED_ORIGINS env var.
    origin: configService
      .get<string>('ALLOWED_ORIGINS', 'http://localhost:3000')
      .split(',')
      .map((o) => o.trim()),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    // Expose the correlation ID header so browser clients can read it
    exposedHeaders: ['x-request-id'],
  });

  // ─── Global Pipes ──────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ─── Start server ──────────────────────────────────────────────────────
  await app.listen(port);
  app.get(Logger).log(
    `🚀 API Gateway running on port ${port} [${nodeEnv}]`,
    'Bootstrap',
  );

  // ─── Graceful Shutdown ─────────────────────────────────────────────────
  // Lets in-flight requests complete before exit.
  // Essential for zero-downtime rolling deploys in K8s / Swarm.
  app.enableShutdownHooks();

  const shutdown = async (signal: string): Promise<void> => {
    app.get(Logger).log(
      `Received ${signal}. Shutting down gracefully…`,
      'Bootstrap',
    );
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

void bootstrap();
