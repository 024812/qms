CREATE TABLE "auth_account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "auth_session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "auth_user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "auth_user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "auth_verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "auth_account" ADD CONSTRAINT "auth_account_user_id_auth_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_session" ADD CONSTRAINT "auth_session_user_id_auth_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "auth_account_user_idx" ON "auth_account" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_account_provider_account_idx" ON "auth_account" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "auth_session_token_idx" ON "auth_session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "auth_session_user_idx" ON "auth_session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "auth_user_email_idx" ON "auth_user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "auth_verification_identifier_idx" ON "auth_verification" USING btree ("identifier");
--> statement-breakpoint
INSERT INTO "auth_user" ("id", "name", "email", "email_verified", "created_at", "updated_at")
SELECT "id", "name", "email", false, "created_at", "updated_at"
FROM "users"
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "email" = EXCLUDED."email",
  "updated_at" = EXCLUDED."updated_at";
--> statement-breakpoint
INSERT INTO "auth_account" (
  "id",
  "account_id",
  "provider_id",
  "user_id",
  "password",
  "created_at",
  "updated_at"
)
SELECT
  'credential_' || "id",
  "id",
  'credential',
  "id",
  "hashed_password",
  "created_at",
  "updated_at"
FROM "users"
ON CONFLICT ("provider_id", "account_id") DO UPDATE SET
  "password" = EXCLUDED."password",
  "updated_at" = EXCLUDED."updated_at";
