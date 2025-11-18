import { query } from './client';

export interface DbUser {
  id: number;
  email: string;
  name: string | null;
  created_at: string;
  updated_at: string;
}

export async function getUserByEmail(email: string): Promise<DbUser | null> {
  const result = await query<DbUser>('SELECT * FROM users WHERE email = $1 LIMIT 1', [email]);
  return result.rows[0] ?? null;
}

export async function getUserById(id: number): Promise<DbUser | null> {
  const result = await query<DbUser>('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
  return result.rows[0] ?? null;
}

export async function ensureUser(email: string, name?: string): Promise<DbUser> {
  const existing = await getUserByEmail(email);
  if (existing) {
    if (name && name !== existing.name) {
      const updated = await query<DbUser>(
        'UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [name, existing.id],
      );
      return updated.rows[0];
    }
    return existing;
  }
  const inserted = await query<DbUser>(
    'INSERT INTO users (email, name) VALUES ($1, $2) RETURNING *',
    [email, name ?? null],
  );
  return inserted.rows[0];
}
