import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Logger } from '@repo/common';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from '../catalog/entities/product.entity';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly logger: Logger,
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    private readonly dataSource: DataSource,
  ) {}

  async createOrder(userId: string, createOrderDto: CreateOrderDto) {
    // We use a Transaction to ensure stock is checked and decremented safely
    return await this.dataSource.transaction(async (manager) => {
      let totalAmount = 0;
      const orderItemsToSave: OrderItem[] = [];

      for (const item of createOrderDto.items) {
        // Find product and lock for update to prevent race conditions during checkout
        const product = await manager.findOne(Product, {
          where: { id: item.productId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!product) {
          throw new NotFoundException(`Product with ID ${item.productId} not found`);
        }

        if (product.stockQuantity < item.quantity) {
          throw new BadRequestException(`Insufficient stock for product ${product.name}`);
        }

        // Decrement stock
        product.stockQuantity -= item.quantity;
        await manager.save(product);

        // Calculate amount
        const unitPrice = Number(product.price);
        totalAmount += unitPrice * item.quantity;

        const orderItem = manager.create(OrderItem, {
          productId: product.id,
          quantity: item.quantity,
          unitPrice, // Store actual price at time of purchase
        });
        orderItemsToSave.push(orderItem);
      }

      const order = manager.create(Order, {
        userId,
        status: OrderStatus.PENDING,
        totalAmount,
        shippingAddressId: createOrderDto.shippingAddressId,
        items: orderItemsToSave,
      });

      return await manager.save(order);
    });
  }

  async getUserOrders(userId: string) {
    return this.orderRepo.find({
      where: { userId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
  }

  async getOrderById(userId: string, orderId: string) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, userId },
      relations: ['items'],
    });

    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async markOrderAsPaid(orderId: string): Promise<void> {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (order && order.status === OrderStatus.PENDING) {
      order.status = OrderStatus.PAID;
      await this.orderRepo.save(order);
      this.logger.log(`Saga Event Processed: Order ${orderId} successfully marked as PAID.`);
    } else {
      this.logger.warn(`Saga Event Ignored: Order ${orderId} not found or not in PENDING status.`);
    }
  }
}
