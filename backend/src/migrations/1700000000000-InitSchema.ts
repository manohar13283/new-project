import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1700000000000 implements MigrationInterface {
  name = 'InitSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`CREATE TYPE "coupon_type_enum" AS ENUM ('BREAKFAST_TEA', 'MEAL', 'TEA')`);
    await queryRunner.query(`CREATE TYPE "shift_code_enum" AS ENUM ('1ST', '2ND', '3RD')`);
    await queryRunner.query(`CREATE TYPE "transaction_status_enum" AS ENUM ('SUCCESS', 'REJECTED')`);
    await queryRunner.query(`CREATE TYPE "reject_reason_enum" AS ENUM ('ALREADY_USED_TODAY','OUTSIDE_SHIFT_WINDOW','BALANCE_EXHAUSTED','INVALID_QR_CODE','WORKER_INACTIVE','HOLIDAY')`);
    await queryRunner.query(`CREATE TYPE "admin_role_enum" AS ENUM ('SUPER_ADMIN','ADMIN','CANTEEN_STAFF')`);

    await queryRunner.query(`
      CREATE TABLE "factory" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )`);

    await queryRunner.query(`
      CREATE TABLE "canteen" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "factory_id" uuid NOT NULL REFERENCES "factory"("id") ON DELETE CASCADE,
        "name" varchar NOT NULL,
        "location" varchar NOT NULL
      )`);

    await queryRunner.query(`
      CREATE TABLE "qr_code" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "canteen_id" uuid NOT NULL REFERENCES "canteen"("id") ON DELETE CASCADE,
        "code_value" varchar NOT NULL UNIQUE,
        "active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )`);

    await queryRunner.query(`
      CREATE TABLE "department" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "factory_id" uuid NOT NULL REFERENCES "factory"("id") ON DELETE CASCADE,
        "name" varchar NOT NULL
      )`);

    await queryRunner.query(`
      CREATE TABLE "shift" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "code" shift_code_enum NOT NULL UNIQUE,
        "name" varchar NOT NULL
      )`);

    await queryRunner.query(`
      CREATE TABLE "shift_meal_window" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "shift_id" uuid NOT NULL REFERENCES "shift"("id") ON DELETE CASCADE,
        "coupon_type" coupon_type_enum NOT NULL,
        "start_time" varchar(5) NOT NULL,
        "end_time" varchar(5) NOT NULL,
        "crosses_midnight" boolean NOT NULL DEFAULT false
      )`);
    await queryRunner.query(`CREATE INDEX "idx_shift_meal_window_shift_type" ON "shift_meal_window" ("shift_id", "coupon_type")`);

    await queryRunner.query(`
      CREATE TABLE "worker" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "clock_number" varchar NOT NULL UNIQUE,
        "full_name" varchar NOT NULL,
        "password_hash" varchar NOT NULL,
        "department_id" uuid NOT NULL REFERENCES "department"("id"),
        "shift_id" uuid NOT NULL REFERENCES "shift"("id"),
        "factory_id" uuid NOT NULL REFERENCES "factory"("id"),
        "phone" varchar,
        "photo_url" varchar,
        "language_pref" varchar NOT NULL DEFAULT 'en',
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )`);
    await queryRunner.query(`CREATE INDEX "idx_worker_department" ON "worker" ("department_id")`);

    await queryRunner.query(`
      CREATE TABLE "monthly_coupon_allocation" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "worker_id" uuid NOT NULL REFERENCES "worker"("id") ON DELETE CASCADE,
        "year" int NOT NULL,
        "month" int NOT NULL,
        "breakfast_tea_total" int NOT NULL DEFAULT 26,
        "breakfast_tea_used" int NOT NULL DEFAULT 0,
        "meal_total" int NOT NULL DEFAULT 26,
        "meal_used" int NOT NULL DEFAULT 0,
        "tea_total" int NOT NULL DEFAULT 26,
        "tea_used" int NOT NULL DEFAULT 0,
        "generated_at" timestamptz NOT NULL,
        CONSTRAINT "uq_worker_month" UNIQUE ("worker_id", "year", "month")
      )`);
    await queryRunner.query(`CREATE INDEX "idx_allocation_year_month" ON "monthly_coupon_allocation" ("year", "month")`);

    await queryRunner.query(`
      CREATE TABLE "coupon_transaction" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "worker_id" uuid NOT NULL REFERENCES "worker"("id") ON DELETE CASCADE,
        "shift_id" uuid NOT NULL REFERENCES "shift"("id"),
        "shift_meal_window_id" uuid REFERENCES "shift_meal_window"("id"),
        "canteen_id" uuid NOT NULL REFERENCES "canteen"("id"),
        "qr_code_id" uuid NOT NULL REFERENCES "qr_code"("id"),
        "coupon_type" coupon_type_enum NOT NULL,
        "business_date" date NOT NULL,
        "scanned_at" timestamptz NOT NULL DEFAULT now(),
        "status" transaction_status_enum NOT NULL,
        "reject_reason" reject_reason_enum,
        "device_id" varchar
      )`);
    await queryRunner.query(`CREATE INDEX "idx_txn_worker_date" ON "coupon_transaction" ("worker_id", "business_date")`);
    await queryRunner.query(`CREATE INDEX "idx_txn_business_date" ON "coupon_transaction" ("business_date")`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_one_success_per_type_per_day"
      ON "coupon_transaction" ("worker_id", "coupon_type", "business_date")
      WHERE "status" = 'SUCCESS'
    `);

    await queryRunner.query(`
      CREATE TABLE "feedback" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "transaction_id" uuid NOT NULL UNIQUE REFERENCES "coupon_transaction"("id") ON DELETE CASCADE,
        "worker_id" uuid NOT NULL REFERENCES "worker"("id") ON DELETE CASCADE,
        "rating" smallint NOT NULL,
        "comment" text,
        "categories" jsonb NOT NULL DEFAULT '[]',
        "photo_url" varchar,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )`);
    await queryRunner.query(`CREATE INDEX "idx_feedback_created_at" ON "feedback" ("created_at")`);

    await queryRunner.query(`
      CREATE TABLE "menu_item" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "canteen_id" uuid NOT NULL REFERENCES "canteen"("id") ON DELETE CASCADE,
        "served_date" date NOT NULL,
        "shift_id" uuid NOT NULL REFERENCES "shift"("id"),
        "coupon_type" coupon_type_enum NOT NULL,
        "description" varchar NOT NULL
      )`);

    await queryRunner.query(`
      CREATE TABLE "holiday" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "factory_id" uuid NOT NULL REFERENCES "factory"("id") ON DELETE CASCADE,
        "holiday_date" date NOT NULL,
        "reason" varchar NOT NULL
      )`);

    await queryRunner.query(`
      CREATE TABLE "notification" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" varchar NOT NULL,
        "body" text NOT NULL,
        "audience_filter" jsonb,
        "sent_at" timestamptz NOT NULL DEFAULT now()
      )`);

    await queryRunner.query(`
      CREATE TABLE "notification_recipient" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "notification_id" uuid NOT NULL REFERENCES "notification"("id") ON DELETE CASCADE,
        "worker_id" uuid NOT NULL REFERENCES "worker"("id") ON DELETE CASCADE,
        "read" boolean NOT NULL DEFAULT false
      )`);

    await queryRunner.query(`
      CREATE TABLE "device_session" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "worker_id" uuid NOT NULL REFERENCES "worker"("id") ON DELETE CASCADE,
        "device_id" varchar NOT NULL,
        "refresh_token_hash" varchar NOT NULL,
        "last_seen_at" timestamptz NOT NULL,
        "expires_at" timestamptz NOT NULL,
        CONSTRAINT "uq_worker_device" UNIQUE ("worker_id", "device_id")
      )`);

    await queryRunner.query(`
      CREATE TABLE "role" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" admin_role_enum NOT NULL UNIQUE
      )`);

    await queryRunner.query(`
      CREATE TABLE "admin_user" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" varchar NOT NULL UNIQUE,
        "password_hash" varchar NOT NULL,
        "role_id" uuid NOT NULL REFERENCES "role"("id"),
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )`);

    await queryRunner.query(`
      CREATE TABLE "audit_log" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "admin_user_id" uuid REFERENCES "admin_user"("id") ON DELETE SET NULL,
        "action" varchar NOT NULL,
        "entity_type" varchar NOT NULL,
        "entity_id" uuid,
        "before" jsonb,
        "after" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "audit_log"`);
    await queryRunner.query(`DROP TABLE "admin_user"`);
    await queryRunner.query(`DROP TABLE "role"`);
    await queryRunner.query(`DROP TABLE "device_session"`);
    await queryRunner.query(`DROP TABLE "notification_recipient"`);
    await queryRunner.query(`DROP TABLE "notification"`);
    await queryRunner.query(`DROP TABLE "holiday"`);
    await queryRunner.query(`DROP TABLE "menu_item"`);
    await queryRunner.query(`DROP TABLE "feedback"`);
    await queryRunner.query(`DROP TABLE "coupon_transaction"`);
    await queryRunner.query(`DROP TABLE "monthly_coupon_allocation"`);
    await queryRunner.query(`DROP TABLE "worker"`);
    await queryRunner.query(`DROP TABLE "shift_meal_window"`);
    await queryRunner.query(`DROP TABLE "shift"`);
    await queryRunner.query(`DROP TABLE "department"`);
    await queryRunner.query(`DROP TABLE "qr_code"`);
    await queryRunner.query(`DROP TABLE "canteen"`);
    await queryRunner.query(`DROP TABLE "factory"`);
    await queryRunner.query(`DROP TYPE "admin_role_enum"`);
    await queryRunner.query(`DROP TYPE "reject_reason_enum"`);
    await queryRunner.query(`DROP TYPE "transaction_status_enum"`);
    await queryRunner.query(`DROP TYPE "shift_code_enum"`);
    await queryRunner.query(`DROP TYPE "coupon_type_enum"`);
  }
}
