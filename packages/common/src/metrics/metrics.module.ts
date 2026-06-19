import { Global, Module, OnModuleInit } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { BusinessMetricsService } from './business-metrics.service';
import { collectDefaultMetrics } from 'prom-client';

/**
 * MetricsModule
 *
 * Global module — import once in the root AppModule.
 * Exposes:
 *   GET /metrics   — Prometheus scrape endpoint
 *   BusinessMetricsService — injectable domain metrics
 */
@Global()
@Module({
  controllers: [MetricsController],
  providers: [BusinessMetricsService],
  exports: [BusinessMetricsService],
})
export class MetricsModule implements OnModuleInit {
  onModuleInit() {
    // Collect default system metrics once per service.
    try {
      collectDefaultMetrics();
    } catch {
      // Ignore if already collecting (prevents errors during HMR or multiple imports)
    }
  }
}
