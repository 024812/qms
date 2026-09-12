ALTER TYPE "public"."antique_category" ADD VALUE 'TOOL' BEFORE 'OTHER';--> statement-breakpoint
ALTER TYPE "public"."map_type" ADD VALUE 'ATLAS' BEFORE 'OTHER';--> statement-breakpoint
ALTER TABLE "paddles" ALTER COLUMN "blade_weight_g" SET DATA TYPE numeric(5, 2);--> statement-breakpoint
ALTER TABLE "antiques" ADD COLUMN "brand" text;--> statement-breakpoint
ALTER TABLE "antiques" ADD COLUMN "model" text;--> statement-breakpoint
ALTER TABLE "antiques" ADD COLUMN "sub_category" text;--> statement-breakpoint
ALTER TABLE "antiques" ADD COLUMN "blade_steel" text;--> statement-breakpoint
ALTER TABLE "antiques" ADD COLUMN "handle_material" text;--> statement-breakpoint
ALTER TABLE "antiques" ADD COLUMN "lock_type" text;--> statement-breakpoint
ALTER TABLE "antiques" ADD COLUMN "set_group" text;--> statement-breakpoint
ALTER TABLE "antiques" ADD COLUMN "sold_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "antiques" ADD COLUMN "sold_date" date;--> statement-breakpoint
ALTER TABLE "maps" ADD COLUMN "published_month" integer;--> statement-breakpoint
ALTER TABLE "maps" ADD COLUMN "print_year" integer;--> statement-breakpoint
ALTER TABLE "maps" ADD COLUMN "print_month" integer;--> statement-breakpoint
ALTER TABLE "maps" ADD COLUMN "series" text;--> statement-breakpoint
ALTER TABLE "maps" ADD COLUMN "isbn" text;--> statement-breakpoint
ALTER TABLE "maps" ADD COLUMN "original_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "maps" ADD COLUMN "province" text;--> statement-breakpoint
ALTER TABLE "maps" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "paddles" ADD COLUMN "thickness_mm" numeric(4, 2);--> statement-breakpoint
ALTER TABLE "paddles" ADD COLUMN "acquired_from" text;--> statement-breakpoint
ALTER TABLE "paddles" ADD COLUMN "sold_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "paddles" ADD COLUMN "sold_date" date;--> statement-breakpoint
ALTER TABLE "spirits" ADD COLUMN "sub_type" text;--> statement-breakpoint
ALTER TABLE "spirits" ADD COLUMN "model" text;--> statement-breakpoint
ALTER TABLE "spirits" ADD COLUMN "acquired_from" text;