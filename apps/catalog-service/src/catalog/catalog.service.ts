import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { Category } from './entities/category.entity';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
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
    
    // We import In from typeorm locally or at file level
    const { In } = await import('typeorm');
    
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
}
