import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../catalog/entities/product.entity';
import { Order } from '../orders/entities/order.entity';
import { ServiceHealthLog } from './entities/service-health-log.entity';
import { ClerkAuthGuard, Roles, RolesGuard } from '@repo/auth';

@Controller('catalog/admin')
@Roles('ADMIN')
@UseGuards(ClerkAuthGuard, RolesGuard)
export class AdminController {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(ServiceHealthLog)
    private readonly healthRepo: Repository<ServiceHealthLog>,
  ) {}

  @Get('stats')
  async getStats() {
    const totalOrders = await this.orderRepo.count();
    const activeProducts = await this.productRepo.count({ where: { status: 'APPROVED', isActive: true } });
    
    // In a real app, users count would come from User Service via TCP.
    // For now, we return mock/approximate stats for UI.
    return {
      totalUsers: 1284, // Mock
      activeProducts,
      totalOrders,
      uptime: '99.9%',
      trends: {
        users: 12,
        products: 5,
        orders: -2
      }
    };
  }

  @Get('health')
  async getHealth() {
    return this.healthRepo.find({
      order: { createdAt: 'DESC' },
      take: 10,
    });
  }

  @Get('products')
  async getAllProducts() {
    return this.productRepo.find({
      relations: ['category'],
      order: { createdAt: 'DESC' }
    });
  }

  @Post('products/:id/approve')
  async approve(@Param('id') id: string) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    product.status = 'APPROVED';
    return this.productRepo.save(product);
  }

  @Post('products/:id/reject')
  async reject(@Param('id') id: string) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    product.status = 'REJECTED';
    return this.productRepo.save(product);
  }
}
