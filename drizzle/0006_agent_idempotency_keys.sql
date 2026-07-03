CREATE TABLE IF NOT EXISTS "agent_idempotency_keys" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "agent_id" text NOT NULL,
  "idempotency_key" text NOT NULL,
  "tool_name" text NOT NULL,
  "input_hash" text NOT NULL,
  "status" text DEFAULT 'in_progress' NOT NULL,
  "response" jsonb,
  "error_message" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "agent_idempotency_keys_agent_key_idx"
  ON "agent_idempotency_keys" USING btree ("agent_id", "idempotency_key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_idempotency_keys_agent_idx"
  ON "agent_idempotency_keys" USING btree ("agent_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_idempotency_keys_created_at_idx"
  ON "agent_idempotency_keys" USING btree ("created_at");
