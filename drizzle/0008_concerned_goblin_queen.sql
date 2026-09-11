CREATE TYPE "public"."antique_category" AS ENUM('JADE', 'WOOD', 'CERAMIC', 'METAL', 'STONE', 'PAPER', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."antique_status" AS ENUM('COLLECTION', 'FOR_SALE', 'SOLD', 'DISPLAY', 'APPRAISAL');--> statement-breakpoint
CREATE TYPE "public"."bottle_status" AS ENUM('SEALED', 'OPENED', 'EMPTY');--> statement-breakpoint
CREATE TYPE "public"."map_material" AS ENUM('PAPER', 'CLOTH', 'DIGITAL', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."map_status" AS ENUM('COLLECTION', 'FOR_SALE', 'SOLD', 'DISPLAY', 'FRAMED');--> statement-breakpoint
CREATE TYPE "public"."map_type" AS ENUM('TOPOGRAPHIC', 'ROAD', 'CITY', 'HISTORICAL', 'THEMATIC', 'NAUTICAL', 'AERONAUTICAL', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."paddle_status" AS ENUM('ACTIVE', 'RETIRED', 'FOR_SALE', 'SOLD', 'DISPLAY');--> statement-breakpoint
CREATE TYPE "public"."spirit_status" AS ENUM('COLLECTION', 'AGING', 'FOR_SALE', 'SOLD', 'OPENED', 'EMPTY');--> statement-breakpoint
CREATE TYPE "public"."spirit_type" AS ENUM('WHISKY', 'COGNAC', 'BRANDY', 'RUM', 'VODKA', 'GIN', 'TEQUILA', 'BAIJIU', 'WINE', 'OTHER');--> statement-breakpoint
CREATE TABLE "antiques" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_number" serial NOT NULL,
	"name" text NOT NULL,
	"category" "antique_category" NOT NULL,
	"material" text,
	"era" text,
	"dynasty" text,
	"length_cm" numeric(10, 2),
	"width_cm" numeric(10, 2),
	"height_cm" numeric(10, 2),
	"weight_g" numeric(10, 2),
	"condition" text,
	"certificate" text,
	"appraisal_date" date,
	"appraisal_by" text,
	"purchase_price" numeric(10, 2),
	"acquired_from" text,
	"acquired_date" date,
	"current_value" numeric(10, 2),
	"estimated_value" numeric(10, 2),
	"status" "antique_status" DEFAULT 'COLLECTION' NOT NULL,
	"location" text,
	"notes" text,
	"main_image" text,
	"attachment_images" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "antiques_item_number_unique" UNIQUE("item_number")
);
--> statement-breakpoint
CREATE TABLE "maps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_number" serial NOT NULL,
	"name" text NOT NULL,
	"map_type" "map_type" NOT NULL,
	"scale" text,
	"published_year" integer,
	"publisher" text,
	"material" "map_material" DEFAULT 'PAPER' NOT NULL,
	"width_cm" numeric(10, 2),
	"height_cm" numeric(10, 2),
	"region" text,
	"country" text,
	"language" text,
	"condition" text,
	"is_original" boolean DEFAULT true NOT NULL,
	"edition" text,
	"acquired_date" date,
	"purchase_price" numeric(10, 2),
	"current_value" numeric(10, 2),
	"status" "map_status" DEFAULT 'COLLECTION' NOT NULL,
	"location" text,
	"notes" text,
	"main_image" text,
	"attachment_images" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "maps_item_number_unique" UNIQUE("item_number")
);
--> statement-breakpoint
CREATE TABLE "paddles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_number" serial NOT NULL,
	"name" text NOT NULL,
	"blade_brand" text,
	"blade_model" text,
	"blade_weight_g" integer,
	"handle_type" text,
	"forehand_rubber" text,
	"backhand_rubber" text,
	"rubber_thickness_mm" numeric(3, 1),
	"blade_speed" integer,
	"blade_control" integer,
	"purchase_date" date,
	"purchase_price" numeric(10, 2),
	"current_value" numeric(10, 2),
	"status" "paddle_status" DEFAULT 'ACTIVE' NOT NULL,
	"condition" text,
	"location" text,
	"notes" text,
	"main_image" text,
	"attachment_images" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "paddles_item_number_unique" UNIQUE("item_number")
);
--> statement-breakpoint
CREATE TABLE "spirits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_number" serial NOT NULL,
	"name" text NOT NULL,
	"spirit_type" "spirit_type" NOT NULL,
	"brand" text,
	"distillery" text,
	"region" text,
	"country" text,
	"vintage" integer,
	"age" integer,
	"abv" numeric(4, 2),
	"volume_ml" integer,
	"bottle_number" text,
	"limited_edition" boolean DEFAULT false NOT NULL,
	"cask_type" text,
	"bottling_date" date,
	"acquired_date" date,
	"purchase_price" numeric(10, 2),
	"current_value" numeric(10, 2),
	"estimated_value" numeric(10, 2),
	"status" "spirit_status" DEFAULT 'COLLECTION' NOT NULL,
	"bottle_status" "bottle_status" DEFAULT 'SEALED' NOT NULL,
	"storage_condition" text,
	"location" text,
	"tasting_notes" text,
	"notes" text,
	"main_image" text,
	"attachment_images" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "spirits_item_number_unique" UNIQUE("item_number")
);
--> statement-breakpoint
CREATE INDEX "antiques_status_idx" ON "antiques" USING btree ("status");--> statement-breakpoint
CREATE INDEX "antiques_category_idx" ON "antiques" USING btree ("category");--> statement-breakpoint
CREATE INDEX "antiques_era_idx" ON "antiques" USING btree ("era");--> statement-breakpoint
CREATE INDEX "antiques_item_number_idx" ON "antiques" USING btree ("item_number");--> statement-breakpoint
CREATE INDEX "maps_status_idx" ON "maps" USING btree ("status");--> statement-breakpoint
CREATE INDEX "maps_map_type_idx" ON "maps" USING btree ("map_type");--> statement-breakpoint
CREATE INDEX "maps_published_year_idx" ON "maps" USING btree ("published_year");--> statement-breakpoint
CREATE INDEX "maps_region_idx" ON "maps" USING btree ("region");--> statement-breakpoint
CREATE INDEX "maps_item_number_idx" ON "maps" USING btree ("item_number");--> statement-breakpoint
CREATE INDEX "paddles_status_idx" ON "paddles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "paddles_blade_brand_idx" ON "paddles" USING btree ("blade_brand");--> statement-breakpoint
CREATE INDEX "paddles_item_number_idx" ON "paddles" USING btree ("item_number");--> statement-breakpoint
CREATE INDEX "spirits_status_idx" ON "spirits" USING btree ("status");--> statement-breakpoint
CREATE INDEX "spirits_spirit_type_idx" ON "spirits" USING btree ("spirit_type");--> statement-breakpoint
CREATE INDEX "spirits_vintage_idx" ON "spirits" USING btree ("vintage");--> statement-breakpoint
CREATE INDEX "spirits_brand_idx" ON "spirits" USING btree ("brand");--> statement-breakpoint
CREATE INDEX "spirits_item_number_idx" ON "spirits" USING btree ("item_number");