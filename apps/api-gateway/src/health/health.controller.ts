import { Controller, Get, HttpCode, HttpStatus, Logger } from '@nestjs/common';

/**
 * Health controller exposing two separate endpoints required for
 * Kubernetes (and Docker Swarm with health-check configs):
 *
 *  - liveness: checks if the application is running
 *  - readiness: checks if the application is ready to accept traffic
 */
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor() {}

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
    this.logger.log('Readiness check received');
    // In future: add checks for DB connections, message queues, etc.
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'api-gateway',
    };
  }
}
