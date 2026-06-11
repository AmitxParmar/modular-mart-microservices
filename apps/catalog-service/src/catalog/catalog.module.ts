import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Product } from './entities/product.entity';
import { ProductAttribute } from './entities/product-attribute.entity';
import { ProcessedMessage } from './entities/processed-message.entity';
import { ServiceHealthLog } from './entities/service-health-log.entity';
import { CatalogController } from './catalog.controller';
import { AdminController } from './admin.controller';
import { CatalogService } from './catalog.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Category,
      Product,
      ProductAttribute,
      ProcessedMessage,
      ServiceHealthLog,
    ]),
  ],
  controllers: [CatalogController, AdminController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
