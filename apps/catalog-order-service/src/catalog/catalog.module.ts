import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Product } from './entities/product.entity';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { AdminGuard } from './admin.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Category, Product])],
  controllers: [CatalogController],
  providers: [CatalogService, AdminGuard],
  exports: [CatalogService],
})
export class CatalogModule {}
