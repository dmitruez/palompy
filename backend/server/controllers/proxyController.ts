import { env } from '../../config/env';
import { HttpError } from '../../http/errors';
import { RouteContext, RouteResponse } from '../../http/types';
import { assertRecord, assertString } from '../../utils/validation';
import { verifyJwt, JwtPayload } from '../../utils/jwt';
import { requireActiveSubscription } from '../../services/subscriptionService';

interface TokenPayload extends JwtPayload {
  sub?: string | number;
  subscriptionId?: string | number;
}

export class ProxyController {
  async handle(context: RouteContext): Promise<RouteResponse> {
    const token = this.extractToken(context.request.headers ?? {});
    const payload = this.decodeToken(token);
    await requireActiveSubscription(payload.subscriptionId, payload.userId);

    const body = assertRecord(context.request.body ?? {}, 'body');
    const targetPath = assertString(body.targetPath, 'targetPath', { minLength: 2 });
    const method = (body.method ? assertString(body.method, 'method', { minLength: 3 }) : 'POST').toUpperCase();
    if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      throw new HttpError(400, 'Недопустимый HTTP-метод');
    }
    const payloadBody = body.payload ?? null;

    return this.forwardRequest({ method, targetPath, payload: payloadBody });
  }

  private extractToken(headers: RouteContext['request']['headers']): string {
    type HeaderValue = string | string[] | undefined;
    const normalized = headers as Record<string, HeaderValue>;
    const authorizationRaw =
      normalized?.authorization ?? normalized?.Authorization ?? normalized?.AUTHORIZATION;
    const authorization = Array.isArray(authorizationRaw) ? authorizationRaw[0] : authorizationRaw;
    if (!authorization || !authorization.toString().startsWith('Bearer ')) {
      throw new HttpError(401, 'Необходимо предоставить токен авторизации');
    }
    return authorization.toString().slice(7);
  }

  private decodeToken(token: string): { userId: number; subscriptionId: number } {
    try {
      const payload = verifyJwt<TokenPayload>(token, env.apiJwtSecret);
      const userId = Number(payload.sub ?? payload.userId);
      const subscriptionId = Number(payload.subscriptionId);
      if (!Number.isFinite(userId) || !Number.isFinite(subscriptionId)) {
        throw new Error('Invalid payload');
      }
      return { userId, subscriptionId };
    } catch (error) {
      throw new HttpError(401, 'Неверный JWT-токен', { cause: (error as Error).message });
    }
  }

  private async forwardRequest({
    method,
    targetPath,
    payload,
  }: {
    method: string;
    targetPath: string;
    payload: unknown;
  }): Promise<RouteResponse> {
    if (!env.thirdPartyApiBaseUrl) {
      throw new HttpError(500, 'THIRD_PARTY_API_BASE_URL не настроен');
    }
    const url = new URL(targetPath, env.thirdPartyApiBaseUrl);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (env.thirdPartyApiKey) {
      headers.Authorization = `Bearer ${env.thirdPartyApiKey}`;
    }
    const response = await fetch(url.toString(), {
      method,
      headers,
      body: method === 'GET' ? undefined : JSON.stringify(payload ?? {}),
    });
    const text = await response.text();
    let parsed: unknown = text;
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      try {
        parsed = JSON.parse(text);
      } catch (error) {
        parsed = { error: 'Не удалось разобрать ответ сервиса', raw: text };
      }
    }
    const headersOut: Record<string, string> = {};
    if (typeof parsed === 'string') {
      headersOut['Content-Type'] = 'text/plain';
    } else {
      headersOut['Content-Type'] = 'application/json';
    }
    return {
      status: response.status,
      body: parsed,
      headers: headersOut,
    };
  }
}
