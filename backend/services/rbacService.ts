import { query } from '../db/postgres';
import { HttpError } from '../http/errors';

interface UserRoleRow {
  role: string;
}

const roleCache = new Map<number, { roles: Set<string>; loadedAt: number }>();
const CACHE_TTL_MS = 60 * 1000;

export async function requireRoles(userId: number, allowedRoles: string[]): Promise<void> {
  const roles = await getUserRoles(userId);
  const hasRole = allowedRoles.some((role) => roles.has(role));
  if (!hasRole) {
    throw new HttpError(403, 'Недостаточно прав для выполнения запроса');
  }
}

async function getUserRoles(userId: number): Promise<Set<string>> {
  const now = Date.now();
  const cached = roleCache.get(userId);
  if (cached && now - cached.loadedAt < CACHE_TTL_MS) {
    return cached.roles;
  }
  const result = await query<UserRoleRow>('SELECT role FROM user_roles WHERE user_id = $1', [userId]);
  const roles = new Set(result.rows.map((row) => row.role));
  roleCache.set(userId, { roles, loadedAt: now });
  return roles;
}
