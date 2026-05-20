import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Product } from './entities/product.entity';
import { Category } from './entities/category.entity';
import { ProcessedMessage } from './entities/processed-message.entity';
import { ClientProxy, RmqRecordBuilder } from '@nestjs/microservices';
import { InjectPinoLogger, PinoLogger } from '@repo/common';
import { EVENT_PATTERNS } from '@repo/contracts';
import { randomUUID } from 'crypto';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(ProcessedMessage)
    private readonly processedRepo: Repository<ProcessedMessage>,
    @InjectPinoLogger(CatalogService.name)
    private readonly logger: PinoLogger,
    @Inject('RABBITMQ_SERVICE')
    private readonly rabbitClient: ClientProxy,
  ) {}

  async getProducts(filters: {
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    cursor?: string;
    limit?: number;
  }) {
    const {
      categoryId,
      minPrice,
      maxPrice,
      search,
      cursor,
      limit = 10,
    } = filters;

    const query = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.status = :status', { status: 'APPROVED' })
      .andWhere('product.isActive = :isActive', { isActive: true });

    if (categoryId) {
      query.andWhere('category.id = :categoryId', { categoryId });
    }

    if (minPrice !== undefined) {
      query.andWhere('product.price >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      query.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    if (search) {
      query.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (cursor) {
      // UUIDv7 is time-sorted, so we can use it directly as a cursor for stable pagination
      query.andWhere('product.id < :cursor', { cursor });
    }

    // Sort by ID descending (newest first)
    query.orderBy('product.id', 'DESC');

    // Take limit + 1 to determine if there is a next page
    query.take(limit + 1);

    const products = await query.getMany();
    const hasNextPage = products.length > limit;
    const items = hasNextPage ? products.slice(0, limit) : products;
    const nextCursor = hasNextPage ? items[items.length - 1].id : null;

    return {
      items,
      nextCursor,
      hasNextPage,
    };
  }

  async getProductBySlug(slug: string) {
    const product = await this.productRepo.findOne({
      where: { slug },
      relations: ['category'],
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async getCategories() {
    return this.categoryRepo.find();
  }

  async createProduct(data: Partial<Product>) {
    const product = this.productRepo.create(data);
    return await this.productRepo.save(product);
  }

  async countActiveProducts() {
    return this.productRepo
      .count({ where: { status: 'APPROVED', isActive: true } })
      .catch(() => 0);
  }

  async getCategoryStats() {
    return this.productRepo
      .createQueryBuilder('product')
      .leftJoin('product.category', 'category')
      .select('category.name', 'name')
      .addSelect('COUNT(product.id)', 'count')
      .groupBy('category.name')
      .getRawMany()
      .then((rows) => rows as { name: string | null; count: string | number }[])
      .catch(() => []);
  }

  async getAllProducts() {
    return this.productRepo.find({
      relations: ['category'],
      order: { createdAt: 'DESC' },
    });
  }

  async getProductsBatch(productIds: string[]) {
    if (!productIds || productIds.length === 0) return [];
    
    return this.productRepo.find({
      where: { id: In(productIds) },
    });
  }

  async approveProduct(id: string) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    product.status = 'APPROVED';
    return this.productRepo.save(product);
  }

  async rejectProduct(id: string) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    product.status = 'REJECTED';
    return this.productRepo.save(product);
  }

  async reserveStock(items: { productId: string; quantity: number }[]) {
    // We need to use a transaction to safely check and decrement stock
    return this.productRepo.manager.transaction(async (manager) => {
      for (const item of items) {
        const product = await manager.findOne(Product, {
          where: { id: item.productId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!product) {
          return { success: false, error: `Product with ID ${item.productId} not found` };
        }

        if (product.stockQuantity < item.quantity) {
          return { success: false, error: `Insufficient stock for product ${product.name}` };
        }

        product.stockQuantity -= item.quantity;
        await manager.save(product);
      }
      return { success: true };
    });
  }

  async releaseStock(items: { productId: string; quantity: number }[]) {
    this.logger.info(`releasing stock for items: ${JSON.stringify(items)}`);
    return this.productRepo.manager.transaction(async (manager) => {
      for (const item of items) {
        const product = await manager.findOne(Product, {
          where: { id: item.productId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!product) {
          this.logger.warn(`releaseStock: Product with ID ${item.productId} not found`);
          continue;
        }

        product.stockQuantity += item.quantity;
        await manager.save(product);
        this.logger.info(`Released stock for product ${product.id}. New stock: ${product.stockQuantity}`);
      }
      return { success: true };
    });
  }

  async releaseStockWithEvent(
    items: { productId: string; quantity: number }[],
    orderId: string,
    messageId: string,
    eventType: string,
  ) {
    this.logger.info(`releasing stock for items of Order ${orderId} (event: ${eventType}, messageId: ${messageId})`);
    
    const result = await this.productRepo.manager.transaction(async (manager) => {
      // 1. Idempotency check
      const processedRepo = manager.getRepository(ProcessedMessage);
      const alreadyProcessed = await processedRepo.findOne({ where: { id: messageId } });
      if (alreadyProcessed) {
        this.logger.info(`Message ${messageId} already processed (idempotent). Skipping stock release.`);
        return { success: true, alreadyProcessed: true };
      }

      // 2. Perform stock release
      for (const item of items) {
        const product = await manager.findOne(Product, {
          where: { id: item.productId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!product) {
          this.logger.warn(`releaseStock: Product with ID ${item.productId} not found`);
          continue;
        }

        product.stockQuantity += item.quantity;
        await manager.save(product);
        this.logger.info(`Released stock for product ${product.id}. New stock: ${product.stockQuantity}`);
      }

      // 3. Mark message as processed
      const processed = processedRepo.create({ id: messageId, eventType });
      await manager.save(processed);

      return { success: true, alreadyProcessed: false };
    });

    if (result.success && !result.alreadyProcessed) {
      const payload = {
        orderId,
        items,
        releasedAt: new Date().toISOString(),
      };
      const record = new RmqRecordBuilder(payload)
        .setOptions({
          messageId: randomUUID(),
        })
        .build();
      this.rabbitClient.emit(EVENT_PATTERNS.STOCK_RELEASED, record);
      this.logger.info(`Emitted STOCK_RELEASED event for Order ${orderId}.`);
    }
    return result;
  }

  async handleStockReserveRequest(
    orderId: string,
    items: { productId: string; quantity: number }[],
    messageId: string,
  ) {
    this.logger.info(`Processing stock reserve request for Order ${orderId} (messageId: ${messageId})`);
    
    const result = await this.productRepo.manager.transaction(async (manager) => {
      // 1. Idempotency check
      const processedRepo = manager.getRepository(ProcessedMessage);
      const alreadyProcessed = await processedRepo.findOne({ where: { id: messageId } });
      if (alreadyProcessed) {
        this.logger.info(`Message ${messageId} already processed (idempotent). Skipping stock reservation.`);
        return { success: true, alreadyProcessed: true };
      }

      // 2. Perform stock reservation
      for (const item of items) {
        const product = await manager.findOne(Product, {
          where: { id: item.productId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!product) {
          return { success: false, error: `Product with ID ${item.productId} not found` };
        }

        if (product.stockQuantity < item.quantity) {
          return { success: false, error: `Insufficient stock for product ${product.name}` };
        }

        product.stockQuantity -= item.quantity;
        await manager.save(product);
      }

      // 3. Mark message as processed
      const processed = processedRepo.create({ id: messageId, eventType: EVENT_PATTERNS.STOCK_RESERVE_REQUESTED });
      await manager.save(processed);

      return { success: true, alreadyProcessed: false };
    });

    if (result.success) {
      if (result.alreadyProcessed) {
        return;
      }
      this.logger.info(`Successfully reserved stock for Order ${orderId}. Emitting stock.reserved.`);
      const payload = {
        orderId,
        items,
        reservedAt: new Date().toISOString(),
      };
      const record = new RmqRecordBuilder(payload)
        .setOptions({
          messageId: randomUUID(),
        })
        .build();
      this.rabbitClient.emit(EVENT_PATTERNS.STOCK_RESERVED, record);
    } else {
      this.logger.warn(`Failed to reserve stock for Order ${orderId}: ${result.error}. Emitting stock.reserve.failed.`);
      const payload = {
        orderId,
        reason: result.error,
        failedAt: new Date().toISOString(),
      };
      const record = new RmqRecordBuilder(payload)
        .setOptions({
          messageId: randomUUID(),
        })
        .build();
      this.rabbitClient.emit(EVENT_PATTERNS.STOCK_RESERVE_FAILED, record);
    }
  }

  getLogger() {
    return this.logger;
  }
}
