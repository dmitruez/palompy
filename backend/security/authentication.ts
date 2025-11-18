import { env } from '../config/env';
import { HttpError } from '../http/errors';
import { JwtPayload, verifyJwt } from '../utils/jwt';

export interface ApiTokenPayload extends JwtPayload {
  sub?: string | number;
  userId?: string | number;
  subscriptionId?: string | number;
  roles?: string[] | string;
}

export interface AuthenticatedUser {
  token: string;
  userId: number;
  subscriptionId?: number;
  roles: string[];
}

export function authenticateRequest(headers: Record<string, string>): AuthenticatedUser {
  const token = extractBearerToken(headers);
  try {
    const payload = verifyJwt<ApiTokenPayload>(token, env.apiJwtSecret);
    const userIdRaw = payload.userId ?? payload.sub;
    const userId = Number(userIdRaw);
    if (!Number.isFinite(userId)) {
      throw new Error('userId отсутствует');
    }
    const subscriptionId = payload.subscriptionId ? Number(payload.subscriptionId) : undefined;
    const roles: string[] = Array.isArray(payload.roles)
      ? payload.roles.map((role) => role.toString())
      : payload.roles
        ? [payload.roles.toString()]
        : [];
    return { token, userId, subscriptionId, roles };
  } catch (error) {
    throw new HttpError(401, 'Неверный JWT-токен', { cause: (error as Error).message });
  }
}

function extractBearerToken(headers: Record<string, string>): string {
  const authorization = headers.authorization ?? headers.Authorization ?? headers.AUTHORIZATION;
  if (!authorization || !authorization.startsWith('Bearer ')) {
    throw new HttpError(401, 'Необходимо предоставить токен авторизации');
  }
  return authorization.slice(7);
}
