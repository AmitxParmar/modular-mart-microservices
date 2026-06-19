import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { register } from 'prom-client';
import { InternalOnlyGuard } from '../guards/internal-only.guard';

/**
 * MetricsController
 *
 * Exposes Prometheus metrics at GET /metrics.
 * Protected by InternalOnlyGuard — only requests bearing X-Gateway-Secret
 * are allowed through. On Render free-tier every service has a public URL,
 * so this prevents external actors from scraping internal telemetry.
 */
@Controller('metrics')
@UseGuards(InternalOnlyGuard)
export class MetricsController {
  @Get()
  async getMetrics(@Res() res: Response): Promise<void> {
    res.set('Content-Type', register.contentType);
    res.send(await register.metrics());
  }
}
