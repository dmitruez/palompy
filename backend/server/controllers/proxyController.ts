import { env } from '../../config/env';
import { HttpError } from '../../http/errors';
import { RouteContext, RouteResponse } from '../../http/types';
import { assertRecord, assertString } from '../../utils/validation';
import { requireActiveSubscription } from '../../services/subscriptionService';
import { authenticateRequest } from '../../security/authentication';
import { requireRoles } from '../../services/rbacService';

export class ProxyController {
  async handle(context: RouteContext): Promise<RouteResponse> {
    const auth = authenticateRequest(context.request.headers ?? {});
    if (!auth.subscriptionId) {
      throw new HttpError(401, 'JWT не содержит subscriptionId');
    }
    await requireActiveSubscription(auth.subscriptionId, auth.userId);
    await requireRoles(auth.userId, ['integration:invoke', 'admin']);

    const body = assertRecord(context.request.body ?? {}, 'body');
    const targetPath = assertString(body.targetPath, 'targetPath', { minLength: 2 });
    const method = (body.method ? assertString(body.method, 'method', { minLength: 3 }) : 'POST').toUpperCase();
    if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      throw new HttpError(400, 'Недопустимый HTTP-метод');
    }
    const payloadBody = body.payload ?? null;

    return this.forwardRequest({ method, targetPath, payload: payloadBody });
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
