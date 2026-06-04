import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entities/order.entity';
import { OrderStatusHistory } from '../entities/order-status-history.entity';
import { OrderStatus } from '@repo/contracts';

/**
 * Service responsible for calculating order-related analytics and statistics.
 * Handles read-heavy reporting operations.
 */
@Injectable()
export class OrderAnalyticsService {
  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderStatusHistory)
    private readonly historyRepo: Repository<OrderStatusHistory>,
  ) {}

  /**
   * Calculates comprehensive statistics for a specific seller.
   * Includes earnings, order counts, and status breakdown.
   * 
   * @param sellerId - The ID of the seller to fetch stats for.
   * @returns An object containing calculated seller metrics.
   */
  async getSellerStats(sellerId: string) {
    const orders = await this.orderRepo.find({
      where: { sellerId },
    });

    // 1. Calculate total earnings from successful/active orders
    const totalEarnings = orders
      .filter((o) => [
        OrderStatus.DELIVERED, 
        OrderStatus.PAID, 
        OrderStatus.APPROVED, 
        OrderStatus.PROCESSING, 
        OrderStatus.SHIPPED
      ].includes(o.status))
      .reduce((sum, o) => sum + Number(o.totalAmount), 0);

    const totalOrders = orders.length;

    // 2. Count orders currently in a pending or early processing state
    const pendingOrders = orders.filter(
      (o) => [
        OrderStatus.PENDING_STOCK, 
        OrderStatus.PAYMENT_PENDING, 
        OrderStatus.PAID
      ].includes(o.status),
    ).length;

    // 3. Calculate earnings from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentEarnings = orders
      .filter((o) => 
        o.createdAt >= thirtyDaysAgo && 
        [
          OrderStatus.DELIVERED, 
          OrderStatus.PAID, 
          OrderStatus.APPROVED, 
          OrderStatus.PROCESSING, 
          OrderStatus.SHIPPED
        ].includes(o.status)
      )
      .reduce((sum, o) => sum + Number(o.totalAmount), 0);

    // 4. Group orders by their current functional status for visualization
    return {
      totalEarnings,
      totalOrders,
      pendingOrders,
      recentEarnings,
      orderStatusBreakdown: {
        pending: orders.filter(o => 
          o.status === OrderStatus.PENDING_STOCK || 
          o.status === OrderStatus.PAYMENT_PENDING
        ).length,
        processing: orders.filter(o => 
          o.status === OrderStatus.PAID || 
          o.status === OrderStatus.APPROVED || 
          o.status === OrderStatus.PROCESSING
        ).length,
        shipped: orders.filter(o => o.status === OrderStatus.SHIPPED).length,
        delivered: orders.filter(o => o.status === OrderStatus.DELIVERED).length,
        cancelled: orders.filter(o => 
          o.status === OrderStatus.CANCELLED || 
          o.status === OrderStatus.REJECTED
        ).length,
      }
    };
  }

  /**
   * Fetches the full status history for a specific order.
   * 
   * @param orderId - ID of the order.
   * @returns Array of history entries sorted by date.
   */
  async getOrderHistory(orderId: string) {
    return this.historyRepo.find({
      where: { orderId },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Returns the total count of all orders in the system.
   * 
   * @returns Promise<number> - Total number of orders.
   */
  async countAll(): Promise<number> {
    return this.orderRepo.count().catch(() => 0);
  }

  /**
   * Generates a daily timeline of order volume and total amounts.
   * Useful for charting order trends over time.
   * 
   * @returns An array of daily aggregation objects.
   */
  async getTimeline() {
    return this.orderRepo
      .createQueryBuilder('order')
      .select("DATE_TRUNC('day', order.created_at)", 'date')
      .addSelect('COUNT(order.id)', 'count')
      .addSelect('SUM(order.total_amount)', 'amount')
      .groupBy("DATE_TRUNC('day', order.created_at)")
      .orderBy("DATE_TRUNC('day', order.created_at)", 'ASC')
      .getRawMany()
      .then((rows) =>
        rows.map((r) => ({
          date: r.date,
          count: Number(r.count ?? 0),
          amount: Number(r.amount ?? 0),
        })),
      )
      .catch(() => []);
  }
}
