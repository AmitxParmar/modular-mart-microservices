import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { ClerkAuthGuard, CurrentUser, Roles, RolesGuard } from '@repo/auth';
import type { ClerkUser } from '@repo/auth';
import { Product } from './entities/product.entity';
import { MessagePattern, EventPattern, Payload } from '@nestjs/microservices';
import { EVENT_PATTERNS } from '@repo/contracts';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @EventPattern(EVENT_PATTERNS.STOCK_RESERVE_REQUESTED)
  async handleStockReserveRequested(
    @Payload() data: { orderId: string; items: { productId: string; quantity: number }[] },
  ) {
    await this.catalogService.handleStockReserveRequest(data.orderId, data.items);
  }

  @EventPattern(EVENT_PATTERNS.ORDER_CANCELLED)
  async handleOrderCancelled(
    @Payload() data: { orderId: string; items: { productId: string; quantity: number }[] },
  ) {
    this.catalogService.getLogger().info(
      `Received ORDER_CANCELLED event for Order ${data.orderId}. Releasing stock.`,
    );
    await this.catalogService.releaseStockWithEvent(data.items, data.orderId);
  }

  @EventPattern(EVENT_PATTERNS.ORDER_REJECTED)
  async handleOrderRejected(
    @Payload() data: { orderId: string; items: { productId: string; quantity: number }[] },
  ) {
    this.catalogService.getLogger().info(
      `Received ORDER_REJECTED event for Order ${data.orderId}. Releasing stock.`,
    );
    await this.catalogService.releaseStockWithEvent(data.items, data.orderId);
  }

  @EventPattern(EVENT_PATTERNS.PAYMENT_FAILED)
  async handlePaymentFailed(
    @Payload() data: { orderId: string; items: { productId: string; quantity: number }[] },
  ) {
    this.catalogService.getLogger().info(
      `Received PAYMENT_FAILED event for Order ${data.orderId}. Releasing stock as compensation.`,
    );
    await this.catalogService.releaseStockWithEvent(data.items, data.orderId);
  }

  @MessagePattern('products.count')
  async getProductsCount() {
    return this.catalogService.countActiveProducts();
  }

  @MessagePattern('products.stats')
  async getCategoryStats() {
    return this.catalogService.getCategoryStats();
  }

  @MessagePattern('products.get_batch')
  async getProductsBatch(productIds: string[]) {
    return this.catalogService.getProductsBatch(productIds);
  }

  @MessagePattern('products.reserve_stock')
  async reserveStock(items: { productId: string; quantity: number }[]) {
    return this.catalogService.reserveStock(items);
  }

  @Get('products')
  getProducts(
    @Query('categoryId') categoryId?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('search') search?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.catalogService.getProducts({
      categoryId,
      minPrice: minPrice ? Number.parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? Number.parseFloat(maxPrice) : undefined,
      search,
      cursor,
      limit: limit ? Number.parseInt(limit, 10) : undefined,
    });
  }

  @Get('products/:slug')
  getProduct(@Param('slug') slug: string) {
    return this.catalogService.getProductBySlug(slug);
  }

  @Get('categories')
  getCategories() {
    return this.catalogService.getCategories();
  }

  @Post('products')
  @Roles('ADMIN', 'SELLER')
  @UseGuards(ClerkAuthGuard, RolesGuard)
  createProduct(
    @CurrentUser() user: ClerkUser,
    @Body() productData: Partial<Product>,
  ) {
    // In a real scenario, we would attach user.internalId as seller_id here
    return this.catalogService.createProduct(productData);
  }

  @Get('admin/products')
  @Roles('ADMIN')
  @UseGuards(ClerkAuthGuard, RolesGuard)
  async getAllProducts() {
    return this.catalogService.getAllProducts();
  }

  @Post('admin/products/:id/approve')
  @Roles('ADMIN')
  @UseGuards(ClerkAuthGuard, RolesGuard)
  async approve(@Param('id') id: string) {
    return this.catalogService.approveProduct(id);
  }

  @Post('admin/products/:id/reject')
  @Roles('ADMIN')
  @UseGuards(ClerkAuthGuard, RolesGuard)
  async reject(@Param('id') id: string) {
    return this.catalogService.rejectProduct(id);
  }
}
