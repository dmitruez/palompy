import { RouteResponse } from './types';

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): RouteResponse {
  return {
    status,
    body,
    headers: { 'Content-Type': 'application/json', ...headers },
  };
}

export function noContent(): RouteResponse {
  return { status: 204, body: null };
}
