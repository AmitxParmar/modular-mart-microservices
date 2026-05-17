import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialCatalogSchema1779028229413 implements MigrationInterface {
    name = 'InitialCatalogSchema1779028229413'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "categories" ("id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying NOT NULL, "slug" character varying NOT NULL, "description" text, CONSTRAINT "UQ_420d9f679d41281f282f5bc7d09" UNIQUE ("slug"), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."products_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED')`);
        await queryRunner.query(`CREATE TABLE "products" ("id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying NOT NULL, "slug" character varying NOT NULL, "description" text, "price" numeric(10,2) NOT NULL, "stock_quantity" integer NOT NULL DEFAULT '0', "seller_id" character varying, "status" "public"."products_status_enum" NOT NULL DEFAULT 'PENDING', "is_active" boolean NOT NULL DEFAULT true, "category_id" uuid, CONSTRAINT "UQ_464f927ae360106b783ed0b4106" UNIQUE ("slug"), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9a5f6868c96e0069e699f33e12" ON "products" ("category_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_425ee27c69d6b8adc5d6475dcf" ON "products" ("seller_id") `);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_9a5f6868c96e0069e699f33e124" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_9a5f6868c96e0069e699f33e124"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_425ee27c69d6b8adc5d6475dcf"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9a5f6868c96e0069e699f33e12"`);
        await queryRunner.query(`DROP TABLE "products"`);
        await queryRunner.query(`DROP TYPE "public"."products_status_enum"`);
        await queryRunner.query(`DROP TABLE "categories"`);
    }

}
