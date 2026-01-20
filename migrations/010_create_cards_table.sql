-- Migration: Create cards table for sports card management
-- Date: 2026-01-20
-- Requirements: 5.3, 5.4, 5.6 - Independent table architecture for cards module
-- 
-- This migration creates:
-- 1. Three enum types for cards (sport_type, grading_company_type, card_status_type)
-- 2. Cards table with 32 columns
-- 3. Seven indexes for optimal query performance
-- 4. Foreign key constraint to users table

-- Create enum types for cards
CREATE TYPE "public"."sport_type" AS ENUM('BASKETBALL', 'SOCCER', 'OTHER');

CREATE TYPE "public"."grading_company_type" AS ENUM('PSA', 'BGS', 'SGC', 'CGC', 'UNGRADED');

CREATE TYPE "public"."card_status_type" AS ENUM('COLLECTION', 'FOR_SALE', 'SOLD', 'GRADING', 'DISPLAY');

-- Create cards table
CREATE TABLE "public"."cards" (
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

-- Add foreign key constraint
ALTER TABLE "public"."cards" 
ADD CONSTRAINT "cards_user_id_users_id_fk" 
FOREIGN KEY ("user_id") 
REFERENCES "public"."users"("id") 
ON DELETE cascade 
ON UPDATE no action;

-- Create indexes for optimal query performance
CREATE INDEX "cards_user_idx" ON "public"."cards" USING btree ("user_id");
CREATE INDEX "cards_sport_idx" ON "public"."cards" USING btree ("sport");
CREATE INDEX "cards_grade_idx" ON "public"."cards" USING btree ("grade");
CREATE INDEX "cards_value_idx" ON "public"."cards" USING btree ("current_value");
CREATE INDEX "cards_status_idx" ON "public"."cards" USING btree ("status");
CREATE INDEX "cards_sport_grade_idx" ON "public"."cards" USING btree ("sport","grade");
CREATE INDEX "cards_item_number_idx" ON "public"."cards" USING btree ("item_number");

-- Migration complete
-- Next steps: Verify table creation with: SELECT * FROM information_schema.tables WHERE table_name = 'cards';
