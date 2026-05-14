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

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

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
}
