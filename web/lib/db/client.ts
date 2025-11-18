import { env } from '../env';

type QueryResult<T> = { rows: T[]; rowCount: number };

type Queryable = {
  query<T>(text: string, params?: unknown[]): Promise<QueryResult<T>>;
};

declare global {
  // eslint-disable-next-line no-var
  var __palompyDbPool: Queryable | undefined;
}

function createPool(): Queryable {
  if (globalThis.__palompyDbPool) {
    return globalThis.__palompyDbPool;
  }
  try {
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
    const pg = require('pg') as { Pool: new (config: Record<string, unknown>) => Queryable };
    globalThis.__palompyDbPool = new pg.Pool({ connectionString: env.databaseUrl });
  } catch (error) {
    console.warn('pg module is not installed. Install it inside the web workspace to enable Postgres access.');
    globalThis.__palompyDbPool = {
      async query() {
        throw new Error('PostgreSQL driver missing. Run "npm install pg" inside web/.');
      },
    } as Queryable;
  }
  return globalThis.__palompyDbPool;
}

export async function query<T>(text: string, params: unknown[] = []): Promise<QueryResult<T>> {
  const pool = createPool();
  return pool.query<T>(text, params);
}
