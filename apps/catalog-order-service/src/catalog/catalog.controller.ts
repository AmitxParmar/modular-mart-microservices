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
  getProducts(@Query('categoryId') categoryId?: string) {
    return this.catalogService.getProducts(categoryId);
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

