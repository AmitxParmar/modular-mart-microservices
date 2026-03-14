import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { CorrelationMiddleware } from './middlewares/correlation.middleware';

/**
 * CommonModule provides globally-registered providers and
 * applies the CorrelationMiddleware to every route.
 *
 * CorrelationMiddleware runs FIRST (before rate limiting or proxying)
 * so that every subsequent middleware, guard, and logger already has
 * access to the X-Request-ID on the request.
 */
@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class CommonModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationMiddleware).forRoutes('*');
  }
}
