import { Module, OnModuleInit } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { collectDefaultMetrics } from 'prom-client';

@Module({
  controllers: [MetricsController],
  exports: [MetricsController],
})
export class MetricsModule implements OnModuleInit {
  onModuleInit() {
    // Collect default system metrics once per service
    try {
      collectDefaultMetrics();
    } catch (e) {
      // Ignore if already collecting (prevents errors during HMR or multiple imports)
    }
  }
}
