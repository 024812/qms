CREATE TYPE "public"."notification_priority" AS ENUM('high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('weather_change', 'maintenance_reminder', 'disposal_suggestion');--> statement-breakpoint
CREATE TYPE "public"."quilt_status" AS ENUM('IN_USE', 'MAINTENANCE', 'STORAGE', 'LOST');--> statement-breakpoint
CREATE TYPE "public"."season" AS ENUM('WINTER', 'SPRING_AUTUMN', 'SUMMER');--> statement-breakpoint
CREATE TYPE "public"."usage_type" AS ENUM('REGULAR', 'GUEST', 'SPECIAL_OCCASION', 'SEASONAL_ROTATION');--> statement-breakpoint
CREATE TABLE "analysis_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cache_key" text NOT NULL,
	"result" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	CONSTRAINT "analysis_cache_cache_key_unique" UNIQUE("cache_key")
);
--> statement-breakpoint
CREATE TABLE "maintenance_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quilt_id" uuid NOT NULL,
	"maintenance_type" text NOT NULL,
	"description" text NOT NULL,
	"performed_at" timestamp NOT NULL,
	"cost" numeric(10, 2),
	"next_due_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"quilt_id" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"action_url" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quilts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_number" serial NOT NULL,
	"name" text NOT NULL,
	"season" "season" NOT NULL,
	"length_cm" integer NOT NULL,
	"width_cm" integer NOT NULL,
	"weight_grams" integer NOT NULL,
	"fill_material" text NOT NULL,
	"material_details" text,
	"color" text NOT NULL,
	"brand" text,
	"packaging_info" text,
	"purchase_date" timestamp,
	"location" text NOT NULL,
	"current_status" "quilt_status" DEFAULT 'STORAGE' NOT NULL,
	"notes" text,
	"image_url" text,
	"thumbnail_url" text,
	"main_image" text,
	"attachment_images" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "quilts_item_number_unique" UNIQUE("item_number")
);
--> statement-breakpoint
CREATE TABLE "seasonal_recommendations" (
	"id" text PRIMARY KEY NOT NULL,
	"season" "season" NOT NULL,
	"min_weight" integer NOT NULL,
	"max_weight" integer NOT NULL,
	"recommended_materials" text NOT NULL,
	"description" text NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "system_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "usage_periods" (
	"id" text PRIMARY KEY NOT NULL,
	"quilt_id" text NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"season_used" text,
	"usage_type" "usage_type" DEFAULT 'REGULAR' NOT NULL,
	"notes" text,
	"duration_days" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quilt_id" uuid NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"usage_type" "usage_type" DEFAULT 'REGULAR',
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "items" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "usage_logs" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "items" CASCADE;--> statement-breakpoint
DROP TABLE "usage_logs" CASCADE;--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "cards" ADD COLUMN "sold_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "cards" ADD COLUMN "sold_date" date;--> statement-breakpoint
ALTER TABLE "cards" ADD COLUMN "valuation_date" timestamp;--> statement-breakpoint
ALTER TABLE "cards" ADD COLUMN "valuation_confidence" text;--> statement-breakpoint
ALTER TABLE "cards" ADD COLUMN "valuation_sources" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "cards" ADD COLUMN "price_history" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_quilt_id_quilts_id_fk" FOREIGN KEY ("quilt_id") REFERENCES "public"."quilts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_quilt_id_quilts_id_fk" FOREIGN KEY ("quilt_id") REFERENCES "public"."quilts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analysis_cache_key_idx" ON "analysis_cache" USING btree ("cache_key");--> statement-breakpoint
CREATE INDEX "analysis_cache_expires_idx" ON "analysis_cache" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "maintenance_records_quilt_idx" ON "maintenance_records" USING btree ("quilt_id");--> statement-breakpoint
CREATE INDEX "maintenance_records_performed_at_idx" ON "maintenance_records" USING btree ("performed_at");--> statement-breakpoint
CREATE INDEX "maintenance_records_next_due_date_idx" ON "maintenance_records" USING btree ("next_due_date");--> statement-breakpoint
CREATE INDEX "idx_notifications_type" ON "notifications" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_notifications_priority" ON "notifications" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_notifications_is_read" ON "notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "idx_notifications_quilt_id" ON "notifications" USING btree ("quilt_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_created_at" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "quilts_status_idx" ON "quilts" USING btree ("current_status");--> statement-breakpoint
CREATE INDEX "quilts_season_idx" ON "quilts" USING btree ("season");--> statement-breakpoint
CREATE INDEX "quilts_item_number_idx" ON "quilts" USING btree ("item_number");--> statement-breakpoint
CREATE INDEX "seasonal_recommendations_season_idx" ON "seasonal_recommendations" USING btree ("season");--> statement-breakpoint
CREATE INDEX "usage_periods_quilt_id_idx" ON "usage_periods" USING btree ("quilt_id");--> statement-breakpoint
CREATE INDEX "usage_periods_start_date_idx" ON "usage_periods" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "usage_periods_end_date_idx" ON "usage_periods" USING btree ("end_date");--> statement-breakpoint
CREATE INDEX "usage_records_quilt_idx" ON "usage_records" USING btree ("quilt_id");--> statement-breakpoint
CREATE INDEX "usage_records_start_date_idx" ON "usage_records" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "usage_records_end_date_idx" ON "usage_records" USING btree ("end_date");--> statement-breakpoint
DROP TYPE "public"."item_status";--> statement-breakpoint
DROP TYPE "public"."item_type";