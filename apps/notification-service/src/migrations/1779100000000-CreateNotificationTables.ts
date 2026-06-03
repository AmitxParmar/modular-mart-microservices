import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Initial migration to create all notification service tables.
 * This migration implements the schema defined in the architecture plan.
 */
export class CreateNotificationTables1779100000000 implements MigrationInterface {
    name = 'CreateNotificationTables1779100000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Create notifications table
        await queryRunner.query(`
            CREATE TABLE "notifications" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "user_id" character varying NOT NULL,
                "type" character varying NOT NULL,
                "priority" character varying NOT NULL,
                "subject" character varying(500),
                "content" text,
                "metadata" jsonb,
                "scheduled_at" TIMESTAMP,
                "is_read" boolean NOT NULL DEFAULT false,
                "read_at" TIMESTAMP,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_notifications" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "idx_notifications_user_id" ON "notifications" ("user_id")`);
        await queryRunner.query(`CREATE INDEX "idx_notifications_is_read" ON "notifications" ("is_read") WHERE is_read = false`);
        await queryRunner.query(`CREATE INDEX "idx_notifications_created_at" ON "notifications" ("created_at")`);

        // 2. Create notification_channels table
        await queryRunner.query(`
            CREATE TABLE "notification_channels" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "notification_id" uuid NOT NULL,
                "channel" character varying NOT NULL,
                "status" character varying NOT NULL DEFAULT 'PENDING',
                "sent_at" TIMESTAMP,
                "failure_reason" text,
                "retry_count" integer NOT NULL DEFAULT 0,
                "max_retries" integer NOT NULL DEFAULT 3,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_notification_channels" PRIMARY KEY ("id"),
                CONSTRAINT "FK_notification_channels_notification" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE CASCADE
            )
        `);
        await queryRunner.query(`CREATE INDEX "idx_channels_notification_id" ON "notification_channels" ("notification_id")`);
        await queryRunner.query(`CREATE INDEX "idx_channels_status" ON "notification_channels" ("status") WHERE status IN ('PENDING', 'RETRYING')`);

        // 3. Create processed_messages table
        await queryRunner.query(`
            CREATE TABLE "processed_messages" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "message_id" character varying NOT NULL,
                "event_type" character varying NOT NULL,
                "processed_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_processed_messages" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_processed_messages_message_id" UNIQUE ("message_id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "idx_processed_messages_message_id" ON "processed_messages" ("message_id")`);

        // 4. Create notification_templates table
        await queryRunner.query(`
            CREATE TABLE "notification_templates" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "type" character varying NOT NULL,
                "channel" character varying NOT NULL,
                "subject" character varying(500),
                "body" text NOT NULL,
                "is_active" boolean NOT NULL DEFAULT true,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_notification_templates" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_templates_type_channel" UNIQUE ("type", "channel")
            )
        `);

        // 5. Create notification_preferences table
        await queryRunner.query(`
            CREATE TABLE "notification_preferences" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "user_id" character varying NOT NULL,
                "email_enabled" boolean NOT NULL DEFAULT true,
                "sms_enabled" boolean NOT NULL DEFAULT false,
                "push_enabled" boolean NOT NULL DEFAULT true,
                "marketing_enabled" boolean NOT NULL DEFAULT false,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_notification_preferences" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_preferences_user_id" UNIQUE ("user_id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "idx_preferences_user_id" ON "notification_preferences" ("user_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "idx_preferences_user_id"`);
        await queryRunner.query(`DROP TABLE "notification_preferences"`);
        await queryRunner.query(`DROP TABLE "notification_templates"`);
        await queryRunner.query(`DROP INDEX "idx_processed_messages_message_id"`);
        await queryRunner.query(`DROP TABLE "processed_messages"`);
        await queryRunner.query(`DROP INDEX "idx_channels_status"`);
        await queryRunner.query(`DROP INDEX "idx_channels_notification_id"`);
        await queryRunner.query(`DROP TABLE "notification_channels"`);
        await queryRunner.query(`DROP INDEX "idx_notifications_created_at"`);
        await queryRunner.query(`DROP INDEX "idx_notifications_is_read"`);
        await queryRunner.query(`DROP INDEX "idx_notifications_user_id"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
    }
}
