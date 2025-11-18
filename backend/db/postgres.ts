import { env } from '../config/env';

interface QueryResult<T> {
  rows: T[];
  rowCount: number;
}

interface Queryable {
  query<T>(text: string, params?: unknown[]): Promise<QueryResult<T>>;
}

let pool: Queryable | null = null;

function createPool(): Queryable {
  if (pool) {
    return pool;
  }
  try {
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
    const pg = require('pg') as { Pool: new (config: Record<string, unknown>) => Queryable };
    pool = new pg.Pool({ connectionString: env.databaseUrl });
  } catch (error) {
    console.warn('pg module is not installed. Database operations will fail until it is added to the project dependencies.');
    pool = {
      async query() {
        throw new Error('PostgreSQL driver is not available. Please install "pg" to enable database access.');
      },
    } as Queryable;
  }
  return pool;
}

export async function query<T>(text: string, params: unknown[] = []): Promise<QueryResult<T>> {
  const client = createPool();
  return client.query<T>(text, params);
}
