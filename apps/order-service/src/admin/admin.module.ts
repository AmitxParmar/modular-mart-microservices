import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../orders/entities/order.entity';
import { ServiceHealthLog } from './entities/service-health-log.entity';
import { AdminController } from './admin.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, ServiceHealthLog]),
    ClientsModule.registerAsync([
      {
        name: 'CATALOG_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL') || 'amqp://localhost:5672'],
            queue: 'catalog_queue',
            queueOptions: {
              durable: true,
              deadLetterExchange: 'dlx_exchange',
              deadLetterRoutingKey: 'dlq_catalog_queue',
            },
          },
        }),
      },
    ]),
  ],
  controllers: [AdminController],
})
export class AdminModule {}
