export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';

export interface RouteRequest {
  method: HttpMethod;
  path: string;
  params: Record<string, string>;
  query: Record<string, string | string[]>;
  body: unknown;
  headers: Record<string, string | undefined>;
}

export interface RouteContext {
  request: RouteRequest;
}

export interface RouteResponse {
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
}

export type RouteHandler = (context: RouteContext) => Promise<RouteResponse | void> | RouteResponse | void;

export interface RouteDefinition {
  method: HttpMethod;
  path: string;
  handler: RouteHandler;
}
