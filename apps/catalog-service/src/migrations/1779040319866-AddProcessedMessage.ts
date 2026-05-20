import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProcessedMessage1779040319866 implements MigrationInterface {
    name = 'AddProcessedMessage1779040319866'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "processed_messages" ("id" text NOT NULL, "event_type" text, "processed_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_processed_messages_id" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "processed_messages"`);
    }

}
