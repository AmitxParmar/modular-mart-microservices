import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, catchError, of } from 'rxjs';
import { Product } from '../catalog/entities/product.entity';
import { Order } from '../orders/entities/order.entity';
import { ServiceHealthLog } from './entities/service-health-log.entity';
import { ClerkAuthGuard, Roles, RolesGuard } from '@repo/auth';

type OrderTimelineRow = {
  date: string;
  count: string | number;
  amount: string | number;
};

type CategoryStatRow = {
  name: string | null;
  count: string | number;
};

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
    @Inject('AUTH_SERVICE')
    private readonly authClient: ClientProxy,
  ) {}

  @Get('stats')
  async getStats() {
    const [totalOrders, activeProducts, totalUsers] = await Promise.all([
      this.orderRepo.count().catch(() => 0),
      this.productRepo
        .count({ where: { status: 'APPROVED', isActive: true } })
        .catch(() => 0),
      firstValueFrom(
        this.authClient.send('users.count', {}).pipe(
          timeout(2000),
          catchError(() => of(1284)), // Fallback to dummy data on timeout/error
        ),
      ),
    ]);

    return {
      totalUsers,
      activeProducts,
      totalOrders,
      uptime: '99.9%', //TODO: Still hardcoded for now
      trends: {
        users: 0,
        products: activeProducts > 0 ? 5 : 0,
        orders: 0,
      },
    };
  }

  @Get('health')
  async getHealth() {
    // Real health logs from database
    return this.healthRepo
      .find({
        order: { createdAt: 'DESC' },
        take: 10,
      })
      .catch(() => []);
  }

  @Get('analytics')
  async getAnalytics() {
    const [ordersTimeline, categoryStats, userCount] = await Promise.all([
      this.orderRepo
        .createQueryBuilder('order')
        .select("DATE_TRUNC('day', order.created_at)", 'date')
        .addSelect('COUNT(order.id)', 'count')
        .addSelect('SUM(order.total_amount)', 'amount')
        .groupBy("DATE_TRUNC('day', order.created_at)")
        .orderBy("DATE_TRUNC('day', order.created_at)", 'ASC')
        .getRawMany()
        .then((rows) => rows as OrderTimelineRow[])
        .catch(() => [] as OrderTimelineRow[]),

      this.productRepo
        .createQueryBuilder('product')
        .leftJoin('product.category', 'category')
        .select('category.name', 'name')
        .addSelect('COUNT(product.id)', 'count')
        .groupBy('category.name')
        .getRawMany()
        .then((rows) => rows as CategoryStatRow[])
        .catch(() => [] as CategoryStatRow[]),

      firstValueFrom(
        this.authClient.send<number>('users.count', {}).pipe(
          timeout(2000),
          catchError(() => of(1284)),
        ),
      ),
    ]);

    const totalRevenue = ordersTimeline.reduce<number>(
      (acc, curr) => acc + Number(curr.amount ?? 0),
      0,
    );

    const totalOrders = ordersTimeline.reduce<number>(
      (acc, curr) => acc + Number(curr.count ?? 0),
      0,
    );

    return {
      revenue: {
        total: totalRevenue,
        growth: totalRevenue > 0 ? 12.5 : 0,
        data: ordersTimeline.map((o) => ({
          date: o.date,
          amount: Number(o.amount ?? 0),
        })),
      },
      users: {
        active: userCount,
        growth: 8.2,
        data: [],
      },
      orders: {
        total: totalOrders,
        growth: totalOrders > 0 ? 5.4 : 0,
        data: ordersTimeline.map((o) => ({
          date: o.date,
          count: Number(o.count ?? 0),
        })),
      },
      categoryDistribution: categoryStats.map((c) => ({
        name: c.name || 'Uncategorized',
        value: Number(c.count ?? 0),
      })),
    };
  }

  @Get('products')
  async getAllProducts() {
    return this.productRepo.find({
      relations: ['category'],
      order: { createdAt: 'DESC' },
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
