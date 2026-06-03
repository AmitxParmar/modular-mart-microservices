import { Module, Global } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { createRmqOptions } from '@repo/common/messaging';

@Global()
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'RABBITMQ_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: createRmqOptions({
            urls: [configService.get<string>('RABBITMQ_URL') ?? ''],
            queue: 'catalog_orders_queue',
            deadLetterExchange: 'dlx_exchange',
            deadLetterRoutingKey: 'dlq_catalog_orders_queue',
          }),
        }),
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class MessagingModule {}
