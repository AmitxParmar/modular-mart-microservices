import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOutboxEvent1779038826192 implements MigrationInterface {
    name = 'AddOutboxEvent1779038826192'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "outbox_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "event_type" text NOT NULL, "payload" jsonb NOT NULL, "processed" boolean NOT NULL DEFAULT false, "error_message" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "processed_at" TIMESTAMP, CONSTRAINT "PK_6689a16c00d09b8089f6237f1d2" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "outbox_events"`);
    }

}
