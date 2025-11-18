import { HttpMethod, RouteDefinition } from './types';

interface RouteSegment {
  type: 'static' | 'param';
  value: string;
}

export interface CompiledRoute {
  method: HttpMethod;
  segments: RouteSegment[];
  handler: RouteDefinition['handler'];
  path: string;
}

export function compileRoutes(routes: RouteDefinition[]): CompiledRoute[] {
  return routes.map((route) => ({
    method: route.method,
    handler: route.handler,
    path: route.path,
    segments: route.path
      .split('/')
      .filter(Boolean)
      .map((segment) => {
        if (segment.startsWith(':')) {
          return { type: 'param', value: segment.slice(1) } as RouteSegment;
        }
        return { type: 'static', value: segment } as RouteSegment;
      }),
  }));
}

export function matchRoute(
  method: HttpMethod,
  pathname: string,
  compiled: CompiledRoute[],
): { route: CompiledRoute; params: Record<string, string> } | null {
  const segments = pathname.split('/').filter(Boolean);

  for (const route of compiled) {
    if (route.method !== method) {
      continue;
    }
    if (route.segments.length !== segments.length) {
      continue;
    }
    const params: Record<string, string> = {};
    let matched = true;
    for (let i = 0; i < route.segments.length; i += 1) {
      const routeSegment = route.segments[i];
      const actual = segments[i];
      if (routeSegment.type === 'static' && routeSegment.value !== actual) {
        matched = false;
        break;
      }
      if (routeSegment.type === 'param') {
        params[routeSegment.value] = decodeURIComponent(actual);
      }
    }
    if (matched) {
      return { route, params };
    }
  }
  return null;
}
