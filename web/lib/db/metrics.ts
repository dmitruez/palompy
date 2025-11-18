import { query } from './client';
import type { MetricsSummary } from '@/types/metrics';

interface ClickMetricArgs {
  userId: number;
  action: string;
  metadata?: Record<string, unknown>;
  occurredAt?: string;
}

export async function recordClickMetric(args: ClickMetricArgs): Promise<void> {
  await query(
    `INSERT INTO metrics (type, user_id, action, metadata, created_at)
     VALUES ('click', $1, $2, COALESCE($3, '{}'::jsonb), COALESCE($4::timestamptz, NOW()))`,
    [args.userId, args.action, args.metadata ?? {}, args.occurredAt ?? null],
  );
}

interface VisitorRow {
  bucket: string;
  visitors: number;
}

interface ClickRow {
  action: string;
  count: number;
}

interface PlanRow {
  plan: string;
  requests: number;
}

function resolvePlanMetadata(plan: string): { label: string; limit: number } {
  const normalized = plan.toLowerCase();
  if (normalized.includes('enterprise')) {
    return { label: 'Enterprise', limit: 50000 };
  }
  if (normalized.includes('pro')) {
    return { label: 'Pro', limit: 15000 };
  }
  if (normalized.includes('trial') || normalized.includes('free') || normalized === 'public') {
    return { label: 'Free', limit: 2000 };
  }
  return { label: 'Starter', limit: 5000 };
}

export async function getMetricsSummary(): Promise<MetricsSummary> {
  const totalsResult = await query<{ requests: number; avg_duration: number }>(
    `SELECT COUNT(*)::int AS requests, COALESCE(AVG(duration_ms), 0)::float AS avg_duration
     FROM metrics
     WHERE type = 'request'`,
  );

  const clickTotalResult = await query<{ count: number }>(
    `SELECT COUNT(*)::int AS count
     FROM metrics
     WHERE type = 'click'`,
  );

  const visitorsResult = await query<VisitorRow>(
    `SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS bucket,
            COUNT(DISTINCT COALESCE(NULLIF(metadata->>'sessionId', ''), NULLIF(user_id::text, ''),
                   md5(method || ':' || path || ':' || to_char(date_trunc('minute', created_at), 'YYYY-MM-DD HH24:MI'))))::int AS visitors
     FROM metrics
     WHERE type = 'request'
       AND created_at >= NOW() - INTERVAL '14 days'
     GROUP BY bucket
     ORDER BY bucket`,
  );

  const clicksResult = await query<ClickRow>(
    `SELECT COALESCE(action, 'unknown') AS action, COUNT(*)::int AS count
     FROM metrics
     WHERE type = 'click'
     GROUP BY COALESCE(action, 'unknown')
     ORDER BY count DESC
     LIMIT 10`,
  );

  const planResult = await query<PlanRow>(
    `SELECT COALESCE(plan, 'public') AS plan, COUNT(*)::int AS requests
     FROM metrics
     WHERE type = 'request'
     GROUP BY COALESCE(plan, 'public')
     ORDER BY requests DESC`,
  );

  const visitorsByDay = visitorsResult.rows.map((row) => ({ date: row.bucket, count: Number(row.visitors) }));
  const clickFrequency = clicksResult.rows.map((row) => ({ action: row.action, count: Number(row.count) }));
  const planUsage = planResult.rows.map((row) => {
    const { label, limit } = resolvePlanMetadata(row.plan);
    const used = Math.min(Number(row.requests), limit);
    return {
      plan: row.plan,
      label,
      limit,
      used,
      requestCount: Number(row.requests),
    };
  });

  return {
    totals: {
      requests: totalsResult.rows[0]?.requests ?? 0,
      avgResponseMs: Math.round(totalsResult.rows[0]?.avg_duration ?? 0),
      clicks: clickTotalResult.rows[0]?.count ?? 0,
    },
    visitorsByDay,
    clickFrequency,
    planUsage,
  };
}
