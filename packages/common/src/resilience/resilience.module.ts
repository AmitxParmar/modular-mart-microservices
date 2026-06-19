import { Global, Module } from '@nestjs/common';
import { CircuitBreakerService } from './circuit-breaker.service';
import { ServiceClient } from '../messaging/service-client';

/**
 * ResilienceModule
 *
 * Import this module ONCE in your app's root module.
 * It is marked @Global so CircuitBreakerService and ServiceClient
 * are available throughout the application without re-importing.
 *
 * Exports:
 *   CircuitBreakerService — for direct circuit-breaker.execute() usage
 *   ServiceClient         — the canonical client.send() wrapper
 */
@Global()
@Module({
  providers: [CircuitBreakerService, ServiceClient],
  exports: [CircuitBreakerService, ServiceClient],
})
export class ResilienceModule {}
