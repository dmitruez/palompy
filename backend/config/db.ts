import { Pool } from 'pg';
import { env } from './env';

export const pool = new Pool({
  connectionString: env.databaseUrl,
});

export async function withClient<T>(callback: (client: Pool) => Promise<T>): Promise<T> {
  return callback(pool);
}
