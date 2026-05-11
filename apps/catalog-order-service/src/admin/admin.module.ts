import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../catalog/entities/product.entity';
import { Order } from '../orders/entities/order.entity';
import { ServiceHealthLog } from './entities/service-health-log.entity';
import { AdminController } from './admin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Order, ServiceHealthLog])],
  controllers: [AdminController],
})
export class AdminModule {}
