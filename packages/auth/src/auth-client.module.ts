import { Module, Global } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createRmqOptions } from '@repo/common';

/**
 * AuthClientModule provides a global microservice client for authentication and authorization.
 *
 * ### Rationale
 * In a microservice architecture, services often need to verify user permissions or perform
 * RBAC (Role-Based Access Control) checks. Instead of every service implementing its own
 * auth logic or making slow HTTP calls, this module provides a RabbitMQ-based client
 * that communicates with the `user-service` via the `auth_queue`.
 *
 * ### Key Features
 * - **Global Scope:** Uses the `@Global()` decorator, meaning it only needs to be imported
 *   once in the root `AppModule` to make the `AUTH_SERVICE` client available everywhere.
 * - **Asynchronous Communication:** Uses RabbitMQ (`Transport.RMQ`) to allow for
 *   decoupled, resilient message passing.
 * - **Dynamic Configuration:** Injects `ConfigService` to retrieve the RabbitMQ connection URL.
 *
 * ### Use Cases
 * 1. **Internal RBAC Checks:** Other services (like `order-service`) can emit messages to
 *    validate if a user has the necessary roles to perform an action.
 * 2. **Background Tasks:** Triggering authentication-related side effects (e.g., logging,
 *    security audits) without blocking the main execution flow.
 * 3. **Service Decoupling:** Allowing services to interact with the auth logic without
 *    needing to know the internal implementation details of the `user-service`.
 *
 * @example
 * ```typescript
 * constructor(@Inject('AUTH_SERVICE') private client: ClientProxy) {}
 *
 * someMethod() {
 *   this.client.send({ cmd: 'user.get_role' }, { userId: '123' });
 * }
 * ```
 */
@Global()
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'AUTH_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: createRmqOptions({
            urls: [configService.get<string>('RABBITMQ_URL') ?? ''],
            queue: 'auth_queue',
            deadLetterExchange: 'dlx_exchange',
            deadLetterRoutingKey: 'dlq_auth_queue',
          }),
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class AuthClientModule {}
