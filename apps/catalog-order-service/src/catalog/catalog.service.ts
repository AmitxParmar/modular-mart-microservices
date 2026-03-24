import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { Category } from './entities/category.entity';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @InjectRepository(Category) private readonly categoryRepo: Repository<Category>,
  ) {}

  async getProducts(categoryId?: string) {
    const query = this.productRepo.createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category');

    if (categoryId) {
      query.where('category.id = :categoryId', { categoryId });
    }

    return query.getMany();
  }

  async getProductBySlug(slug: string) {
    const product = await this.productRepo.findOne({
      where: { slug },
      relations: ['category']
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
}
