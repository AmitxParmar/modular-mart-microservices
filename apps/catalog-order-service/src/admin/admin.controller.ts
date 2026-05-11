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

  @Get('analytics')
  async getAnalytics() {
    return {
      revenue: {
        total: 125400,
        growth: 15.4,
        data: [
          { date: '2026-05-01', amount: 4200 },
          { date: '2026-05-02', amount: 3800 },
          { date: '2026-05-03', amount: 5100 },
          { date: '2026-05-04', amount: 4900 },
          { date: '2026-05-05', amount: 6200 },
          { date: '2026-05-06', amount: 5800 },
          { date: '2026-05-07', amount: 7100 },
        ]
      },
      users: {
        active: 842,
        growth: 8.2,
        data: [
          { date: '2026-05-01', count: 720 },
          { date: '2026-05-02', count: 735 },
          { date: '2026-05-03', count: 750 },
          { date: '2026-05-04', count: 780 },
          { date: '2026-05-05', count: 810 },
          { date: '2026-05-06', count: 825 },
          { date: '2026-05-07', count: 842 },
        ]
      },
      orders: {
        total: 1542,
        growth: -2.1,
        data: [
          { date: '2026-05-01', count: 52 },
          { date: '2026-05-02', count: 48 },
          { date: '2026-05-03', count: 61 },
          { date: '2026-05-04', count: 55 },
          { date: '2026-05-05', count: 42 },
          { date: '2026-05-06', count: 49 },
          { date: '2026-05-07', count: 58 },
        ]
      }
    };
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
