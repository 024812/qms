import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from './schema';

export const db = drizzle({
  connection: process.env.DATABASE_URL!,
  ws: ws,
  schema,
});

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export * from './schema';
