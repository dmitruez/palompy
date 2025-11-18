import http from 'http';
import { env } from '../config/env';
import routes from '../routes';
import { compileRoutes, matchRoute } from '../http/router';
import { HttpError } from '../http/errors';
import { HttpMethod, RouteContext, RouteResponse } from '../http/types';
import { attachMetricsTracker } from '../middleware/metricsMiddleware';

const compiledRoutes = compileRoutes(routes);
const JSON_LIMIT = 2 * 1024 * 1024; // 2mb

function buildQuery(searchParams: URLSearchParams): Record<string, string | string[]> {
  const query: Record<string, string | string[]> = {};
  for (const [key, value] of searchParams.entries()) {
    if (query[key]) {
      const existing = query[key];
      if (Array.isArray(existing)) {
        existing.push(value);
      } else {
        query[key] = [existing, value];
      }
    } else {
      query[key] = value;
    }
  }
  return query;
}

async function readBody(req: any): Promise<unknown> {
  const contentType = typeof req.headers?.['content-type'] === 'string' ? req.headers['content-type'] : '';
  const chunks: string[] = [];
  let size = 0;
  for await (const chunk of req) {
    const text = typeof chunk === 'string' ? chunk : chunk.toString();
    size += text.length;
    if (size > JSON_LIMIT) {
      throw new HttpError(413, 'Тело запроса слишком большое');
    }
    chunks.push(text);
  }
  if (!chunks.length) {
    return undefined;
  }
  const raw = chunks.join('');
  if (!raw.trim()) {
    return undefined;
  }
  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(raw);
    } catch (error) {
      throw new HttpError(400, 'Не удалось разобрать JSON');
    }
  }
  return raw;
}

function sendResponse(res: any, response: RouteResponse): void {
  const status = response.status ?? 200;
  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    ...(response.headers ?? {}),
  };
  if (response.body !== undefined && response.body !== null && typeof response.body !== 'string') {
    headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
  }
  Object.entries(headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  if (response.body === undefined || response.body === null) {
    res.statusCode = status;
    res.end();
    return;
  }
  res.statusCode = status;
  const payload = typeof response.body === 'string' ? response.body : JSON.stringify(response.body);
  res.end(payload);
}

function sendError(res: any, error: HttpError | Error): void {
  if (error instanceof HttpError) {
    sendResponse(res, {
      status: error.status,
      body: { error: error.message, details: error.details ?? undefined },
      headers: { 'Content-Type': 'application/json' },
    });
    return;
  }
  console.error('Unexpected error', error);
  sendResponse(res, {
    status: 500,
    body: { error: 'Внутренняя ошибка сервера' },
    headers: { 'Content-Type': 'application/json' },
  });
}

const server = http.createServer(async (req: any, res: any) => {
  const startedAt = Date.now();
  const tracker = attachMetricsTracker(req, res);
  try {
    const method = (req.method ?? 'GET').toUpperCase() as HttpMethod;
    if (method === 'OPTIONS') {
      sendResponse(res, { status: 204 });
      return;
    }
    if (!req.url) {
      throw new HttpError(400, 'Некорректный URL');
    }
    const url = new URL(req.url, `http://localhost:${env.port}`);
    const match = matchRoute(method, url.pathname, compiledRoutes);
    if (!match) {
      throw new HttpError(404, 'Маршрут не найден');
    }
    tracker.setRoutePath(match.route.path ?? url.pathname);
    const body = method === 'GET' ? undefined : await readBody(req);
    const context: RouteContext = {
      request: {
        method,
        path: url.pathname,
        params: match.params,
        query: buildQuery(url.searchParams),
        body,
        headers: req.headers ?? {},
      },
    };
    const result = ((await match.route.handler(context)) ?? { status: 204 }) as RouteResponse;
    sendResponse(res, result);
  } catch (error) {
    sendError(res, error as Error);
  } finally {
    const duration = Date.now() - startedAt;
    const method = req.method ?? 'UNKNOWN';
    const url = req.url ?? '';
    console.log(`${method} ${url} - ${duration}ms`);
  }
});

server.listen(env.port, () => {
  console.log(`palompy backend listening on port ${env.port}`);
});
