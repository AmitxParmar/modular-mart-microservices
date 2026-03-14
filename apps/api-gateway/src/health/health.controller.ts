import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

/**
 * Health controller exposing two separate endpoints required for
 * Kubernetes (and Docker Swarm with health-check configs):
...
...
 */
@Controller('health')
export class HealthController {
  constructor(
    @InjectPinoLogger(HealthController.name)
    private readonly logger: PinoLogger,
  ) {}

  @Get('live')
  @HttpCode(HttpStatus.OK)
  liveness(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  @HttpCode(HttpStatus.OK)
  readiness(): { status: string; timestamp: string; service: string } {
    this.logger.info('Readiness check received');
    // In future: add checks for DB connections, message queues, etc.
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'api-gateway',
    };
  }
}
