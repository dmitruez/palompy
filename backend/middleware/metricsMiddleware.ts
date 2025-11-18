import { enqueueRequestMetric } from '../services/metricsService';
import { bumpRedisCounters } from '../services/redisMetrics';

interface MetricsTracker {
  setRoutePath(path: string): void;
}

export function attachMetricsTracker(req: any, res: any): MetricsTracker {
  const startedAt = Date.now();
  let routePath = req.url ?? '/';
  const method = (req.method ?? 'GET').toUpperCase();
  const planHeader =
    (req.headers['x-plan'] as string | undefined) ||
    (req.headers['x-plan-tier'] as string | undefined) ||
    (req.headers['x-subscription-plan'] as string | undefined) ||
    null;
  const userId = parseUserId(req.headers['x-user-id']);
  const sessionId = typeof req.headers['x-session-id'] === 'string' ? req.headers['x-session-id'] : undefined;
  const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined;
  let completed = false;

  const finalize = () => {
    if (completed) {
      return;
    }
    completed = true;
    const durationMs = Date.now() - startedAt;
    const normalizedPath = routePath.startsWith('/') ? routePath : `/${routePath}`;
    const statusCode = res.statusCode ?? 0;

    void bumpRedisCounters(method, normalizedPath, statusCode);
    enqueueRequestMetric({
      method,
      path: normalizedPath,
      statusCode,
      durationMs: Math.round(durationMs),
      userId: userId ?? undefined,
      plan: planHeader,
      metadata: {
        host: req.headers.host ?? null,
        sessionId: sessionId ?? null,
        userAgent: userAgent ?? null,
      },
    });
  };

  res.once('finish', finalize);
  res.once('close', finalize);

  return {
    setRoutePath(path: string) {
      routePath = path;
    },
  };
}

function parseUserId(value: string | string[] | undefined): number | null {
  if (!value) {
    return null;
  }
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}
