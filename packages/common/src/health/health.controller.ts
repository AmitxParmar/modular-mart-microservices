import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';

/**
 * Shared health controller.
 * Import HealthModule from @repo/common into any service to expose standard
 * K8s liveness + readiness probes at /health/live and /health/ready.
 */
@Controller('health')
export class HealthController {
  @Get('live')
  @HttpCode(HttpStatus.OK)
  liveness(): { status: string; timestamp: string } {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  @HttpCode(HttpStatus.OK)
  readiness(): { status: string; timestamp: string } {
    // Override this in the service if you need real upstream checks.
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
