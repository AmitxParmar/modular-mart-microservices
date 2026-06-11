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
import { MessagePattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { EVENT_PATTERNS } from '@repo/contracts';
import { RabbitMQMessageHandler } from '../common/rabbitmq-message-handler.decorator';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @RabbitMQMessageHandler(EVENT_PATTERNS.STOCK_RESERVE_REQUESTED)
  async handleStockReserveRequested(
    @Payload() data: { orderId: string; items: { productId: string; quantity: number }[] },
    @Ctx() context: RmqContext,
  ) {
    const message = context.getMessage();
    const messageId = message?.properties?.messageId || `${data.orderId}:reserve`;
    await this.catalogService.handleStockReserveRequest(data.orderId, data.items, messageId);
  }

  @RabbitMQMessageHandler(EVENT_PATTERNS.ORDER_CANCELLED)
  async handleOrderCancelled(
    @Payload() data: { orderId: string; items: { productId: string; quantity: number }[] },
    @Ctx() context: RmqContext,
  ) {
    const message = context.getMessage();
    const messageId = message?.properties?.messageId || `${data.orderId}:cancel`;
    this.catalogService.getLogger().info(
      `Received ORDER_CANCELLED event for Order ${data.orderId}. Releasing stock.`,
    );
    await this.catalogService.releaseStockWithEvent(data.items, data.orderId, messageId, EVENT_PATTERNS.ORDER_CANCELLED);
  }

  @RabbitMQMessageHandler(EVENT_PATTERNS.ORDER_REJECTED)
  async handleOrderRejected(
    @Payload() data: { orderId: string; items: { productId: string; quantity: number }[] },
    @Ctx() context: RmqContext,
  ) {
    const message = context.getMessage();
    const messageId = message?.properties?.messageId || `${data.orderId}:reject`;
    this.catalogService.getLogger().info(
      `Received ORDER_REJECTED event for Order ${data.orderId}. Releasing stock.`,
    );
    await this.catalogService.releaseStockWithEvent(data.items, data.orderId, messageId, EVENT_PATTERNS.ORDER_REJECTED);
  }

  @RabbitMQMessageHandler(EVENT_PATTERNS.PAYMENT_FAILED)
  async handlePaymentFailed(
    @Payload() data: { orderId: string; items: { productId: string; quantity: number }[] },
    @Ctx() context: RmqContext,
  ) {
    const message = context.getMessage();
    const messageId = message?.properties?.messageId || `${data.orderId}:payment-fail`;
    this.catalogService.getLogger().info(
      `Received PAYMENT_FAILED event for Order ${data.orderId}. Releasing stock as compensation.`,
    );
    await this.catalogService.releaseStockWithEvent(data.items, data.orderId, messageId, EVENT_PATTERNS.PAYMENT_FAILED);
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
  async getProductsBatch(@Payload() productIds: string[]) {
    return this.catalogService.getProductsBatch(productIds);
  }

  @MessagePattern('products.reserve_stock')
  async reserveStock(@Payload() items: { productId: string; quantity: number }[]) {
    return this.catalogService.reserveStock(items);
  }

  @Get('products')
  getProducts(
    @Query('categoryId') categoryId?: string,
    @Query('categorySlug') categorySlug?: string,
    @Query('brand') brand?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('rating') rating?: string,
    @Query('discount') discount?: string,
    @Query('inStock') inStock?: string,
    @Query('search') search?: string,
    @Query('sort') sort?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.catalogService.getProducts({
      categoryId,
      categorySlug,
      brand,
      minPrice: minPrice && !Number.isNaN(Number.parseFloat(minPrice)) ? Number.parseFloat(minPrice) : undefined,
      maxPrice: maxPrice && !Number.isNaN(Number.parseFloat(maxPrice)) ? Number.parseFloat(maxPrice) : undefined,
      rating: rating && !Number.isNaN(Number.parseFloat(rating)) ? Number.parseFloat(rating) : undefined,
      discount: discount && !Number.isNaN(Number.parseFloat(discount)) ? Number.parseFloat(discount) : undefined,
      inStock: inStock === 'true',
      search,
      sort,
      cursor,
      limit: limit && !Number.isNaN(Number.parseInt(limit, 10)) ? Number.parseInt(limit, 10) : undefined,
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
    return this.catalogService.createProduct({
      ...productData,
      sellerId: user.userId,
    });
  }

  @Get('seller/products')
  @Roles('SELLER')
  @UseGuards(ClerkAuthGuard, RolesGuard)
  async getSellerProducts(@CurrentUser() user: ClerkUser) {
    return this.catalogService.getSellerProducts(user.userId);
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
