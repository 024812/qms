import { drizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleHttp } from 'drizzle-orm/neon-http';
import { neon, Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from './schema';

neonConfig.webSocketConstructor = ws;

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not configured');
  }

  return databaseUrl;
}

let pool: Pool | null = null;
let dbInstance: ReturnType<typeof createDb> | null = null;
let dbHttpInstance: ReturnType<typeof createDbHttp> | null = null;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: getDatabaseUrl(),
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }

  return pool;
}

function createDb() {
  return drizzle(getPool(), { schema });
}

function createDbHttp() {
  return drizzleHttp(neon(getDatabaseUrl()), { schema });
}

export function getDb() {
  if (!dbInstance) {
    dbInstance = createDb();
  }

  return dbInstance;
}

export function getDbHttp() {
  if (!dbHttpInstance) {
    dbHttpInstance = createDbHttp();
  }

  return dbHttpInstance;
}

type Database = ReturnType<typeof createDb>;
type DatabaseHttp = ReturnType<typeof createDbHttp>;

function lazyClient<TClient extends object>(getter: () => TClient): TClient {
  return new Proxy({} as TClient, {
    get(_target, property, receiver) {
      const client = getter();
      const value = Reflect.get(client, property, receiver);
      return typeof value === 'function' ? value.bind(client) : value;
    },
  });
}

export const db = lazyClient<Database>(getDb);
export const dbHttp = lazyClient<DatabaseHttp>(getDbHttp);
export type Tx = Parameters<Parameters<Database['transaction']>[0]>[0];

export * from './schema';
