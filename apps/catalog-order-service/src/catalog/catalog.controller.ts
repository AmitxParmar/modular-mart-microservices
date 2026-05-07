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
import { ClerkAuthGuard, CurrentUser } from '@repo/auth';
import type { ClerkUser } from '@repo/auth';
import { AdminGuard } from './admin.guard';
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
  @UseGuards(ClerkAuthGuard, AdminGuard)
  createProduct(
    @CurrentUser() user: ClerkUser,
    @Body() productData: Partial<Product>,
  ) {
    return this.catalogService.createProduct(productData);
  }
}
