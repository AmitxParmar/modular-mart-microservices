import { MigrationInterface, QueryRunner } from "typeorm";

export class FilterSystem1781167287273 implements MigrationInterface {
    name = 'FilterSystem1781167287273'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_attributes" DROP CONSTRAINT "fk_product_attributes_product"`);
        await queryRunner.query(`DROP INDEX "public"."idx_product_attributes_product"`);
        await queryRunner.query(`DROP INDEX "public"."idx_product_attributes_name"`);
        await queryRunner.query(`DROP INDEX "public"."idx_product_attributes_value"`);
        await queryRunner.query(`DROP INDEX "public"."idx_product_attributes_name_value"`);
        await queryRunner.query(`DROP INDEX "public"."idx_products_rating"`);
        await queryRunner.query(`DROP INDEX "public"."idx_products_discount"`);
        await queryRunner.query(`DROP INDEX "public"."idx_products_active"`);
        await queryRunner.query(`DROP INDEX "public"."idx_products_status"`);
        await queryRunner.query(`DROP INDEX "public"."idx_products_brand"`);
        await queryRunner.query(`DROP INDEX "public"."idx_products_price"`);
        await queryRunner.query(`ALTER TABLE "product_attributes" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "product_attributes" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "product_attributes" ALTER COLUMN "created_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "product_attributes" DROP COLUMN "attribute_name"`);
        await queryRunner.query(`ALTER TABLE "product_attributes" ADD "attribute_name" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "product_attributes" DROP COLUMN "attribute_value"`);
        await queryRunner.query(`ALTER TABLE "product_attributes" ADD "attribute_value" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "brand"`);
        await queryRunner.query(`ALTER TABLE "products" ADD "brand" character varying`);
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "average_rating" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "review_count" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "discount_percentage" SET NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_f5a6700abd0494bae3032cf5bb" ON "product_attributes" ("product_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_a70326a17c7d540f4f6da1da09" ON "product_attributes" ("attribute_name") `);
        await queryRunner.query(`CREATE INDEX "IDX_af837d40fb8a3494d9d11a8ab3" ON "product_attributes" ("attribute_value") `);
        await queryRunner.query(`CREATE INDEX "IDX_a20643749b95d12a1a7a495679" ON "product_attributes" ("attribute_name", "attribute_value") `);
        await queryRunner.query(`CREATE INDEX "IDX_61fac54950763ae56ee51f17fd" ON "products" ("brand") `);
        await queryRunner.query(`CREATE INDEX "IDX_908694880079b2688ea2a5b040" ON "products" ("average_rating") `);
        await queryRunner.query(`CREATE INDEX "IDX_0c9e98260c2e772562d5687fdd" ON "products" ("discount_percentage") `);
        await queryRunner.query(`ALTER TABLE "product_attributes" ADD CONSTRAINT "FK_f5a6700abd0494bae3032cf5bbd" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_attributes" DROP CONSTRAINT "FK_f5a6700abd0494bae3032cf5bbd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0c9e98260c2e772562d5687fdd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_908694880079b2688ea2a5b040"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_61fac54950763ae56ee51f17fd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a20643749b95d12a1a7a495679"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_af837d40fb8a3494d9d11a8ab3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a70326a17c7d540f4f6da1da09"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f5a6700abd0494bae3032cf5bb"`);
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "discount_percentage" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "review_count" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "average_rating" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "brand"`);
        await queryRunner.query(`ALTER TABLE "products" ADD "brand" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "product_attributes" DROP COLUMN "attribute_value"`);
        await queryRunner.query(`ALTER TABLE "product_attributes" ADD "attribute_value" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "product_attributes" DROP COLUMN "attribute_name"`);
        await queryRunner.query(`ALTER TABLE "product_attributes" ADD "attribute_name" character varying(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "product_attributes" ALTER COLUMN "created_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "product_attributes" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "product_attributes" DROP COLUMN "updated_at"`);
        await queryRunner.query(`CREATE INDEX "idx_products_price" ON "products" ("price") `);
        await queryRunner.query(`CREATE INDEX "idx_products_brand" ON "products" ("brand") `);
        await queryRunner.query(`CREATE INDEX "idx_products_status" ON "products" ("status") `);
        await queryRunner.query(`CREATE INDEX "idx_products_active" ON "products" ("is_active") `);
        await queryRunner.query(`CREATE INDEX "idx_products_discount" ON "products" ("discount_percentage") `);
        await queryRunner.query(`CREATE INDEX "idx_products_rating" ON "products" ("average_rating") `);
        await queryRunner.query(`CREATE INDEX "idx_product_attributes_name_value" ON "product_attributes" ("attribute_name", "attribute_value") `);
        await queryRunner.query(`CREATE INDEX "idx_product_attributes_value" ON "product_attributes" ("attribute_value") `);
        await queryRunner.query(`CREATE INDEX "idx_product_attributes_name" ON "product_attributes" ("attribute_name") `);
        await queryRunner.query(`CREATE INDEX "idx_product_attributes_product" ON "product_attributes" ("product_id") `);
        await queryRunner.query(`ALTER TABLE "product_attributes" ADD CONSTRAINT "fk_product_attributes_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
