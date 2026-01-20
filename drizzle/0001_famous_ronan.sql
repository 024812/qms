CREATE TYPE "public"."audit_event_type" AS ENUM('permission_check', 'access_granted', 'access_denied', 'role_changed', 'module_subscribed', 'module_unsubscribed', 'login_success', 'login_failed', 'logout');--> statement-breakpoint
CREATE TYPE "public"."card_status_type" AS ENUM('COLLECTION', 'FOR_SALE', 'SOLD', 'GRADING', 'DISPLAY');--> statement-breakpoint
CREATE TYPE "public"."grading_company_type" AS ENUM('PSA', 'BGS', 'SGC', 'CGC', 'UNGRADED');--> statement-breakpoint
CREATE TYPE "public"."sport_type" AS ENUM('BASKETBALL', 'SOCCER', 'OTHER');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"event_type" "audit_event_type" NOT NULL,
	"resource" text,
	"action" text,
	"success" text NOT NULL,
	"reason" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"item_number" serial NOT NULL,
	"player_name" text NOT NULL,
	"sport" "sport_type" NOT NULL,
	"team" text,
	"position" text,
	"year" integer NOT NULL,
	"brand" text NOT NULL,
	"series" text,
	"card_number" text,
	"grading_company" "grading_company_type" DEFAULT 'UNGRADED',
	"grade" numeric(3, 1),
	"certification_number" text,
	"purchase_price" numeric(10, 2),
	"purchase_date" date,
	"current_value" numeric(10, 2),
	"estimated_value" numeric(10, 2),
	"parallel" text,
	"serial_number" text,
	"is_autographed" boolean DEFAULT false NOT NULL,
	"has_memorabilia" boolean DEFAULT false NOT NULL,
	"memorabilia_type" text,
	"status" "card_status_type" DEFAULT 'COLLECTION' NOT NULL,
	"location" text,
	"storage_type" text,
	"condition" text,
	"notes" text,
	"main_image" text,
	"attachment_images" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cards_item_number_unique" UNIQUE("item_number")
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "hashed_password" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "preferences" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_user_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_event_type_idx" ON "audit_logs" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "audit_logs_success_idx" ON "audit_logs" USING btree ("success");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_resource_idx" ON "audit_logs" USING btree ("resource");--> statement-breakpoint
CREATE INDEX "cards_user_idx" ON "cards" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "cards_sport_idx" ON "cards" USING btree ("sport");--> statement-breakpoint
CREATE INDEX "cards_grade_idx" ON "cards" USING btree ("grade");--> statement-breakpoint
CREATE INDEX "cards_value_idx" ON "cards" USING btree ("current_value");--> statement-breakpoint
CREATE INDEX "cards_status_idx" ON "cards" USING btree ("status");--> statement-breakpoint
CREATE INDEX "cards_sport_grade_idx" ON "cards" USING btree ("sport","grade");--> statement-breakpoint
CREATE INDEX "cards_item_number_idx" ON "cards" USING btree ("item_number");--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "password";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "role";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "active_modules";