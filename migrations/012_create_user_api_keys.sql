CREATE TABLE IF NOT EXISTS user_api_keys (
  id text PRIMARY KEY NOT NULL,
  user_id text NOT NULL REFERENCES users(id) ON DELETE cascade,
  name text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  key_prefix text NOT NULL,
  last_used_at timestamp,
  created_at timestamp DEFAULT now() NOT NULL,
  revoked_at timestamp
);

CREATE INDEX IF NOT EXISTS user_api_keys_user_idx ON user_api_keys USING btree (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS user_api_keys_key_hash_idx
  ON user_api_keys USING btree (key_hash);
