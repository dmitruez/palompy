import { pool } from '../config/db';
import { AnalyticsSummary } from '../models/analytics';

interface WidgetEventRow {
  event_name: string;
  count: string;
}

interface ButtonRow {
  label: string;
  count: string;
}

export async function recordWidgetEvent(payload: {
  shopId: number;
  sessionId: string;
  eventName: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await pool.query(
    `INSERT INTO widget_events (shop_id, session_id, event_name, metadata)
     VALUES ($1, $2, $3, $4)`,
    [payload.shopId, payload.sessionId, payload.eventName, payload.metadata ?? null],
  );
}

export async function getAnalyticsSummary(shopId: number): Promise<AnalyticsSummary> {
  const [eventsResult, buttonsResult, durationResult] = await Promise.all([
    pool.query<WidgetEventRow>(
      `SELECT event_name, COUNT(*)::text as count
       FROM widget_events
       WHERE shop_id = $1
       GROUP BY event_name
       ORDER BY COUNT(*) DESC
       LIMIT 50`,
      [shopId],
    ),
    pool.query<ButtonRow>(
      `SELECT COALESCE(metadata->>'label', metadata->>'buttonId', event_name) as label, COUNT(*)::text as count
       FROM widget_events
       WHERE shop_id = $1
         AND metadata IS NOT NULL
         AND (metadata ? 'label' OR metadata ? 'buttonId')
       GROUP BY label
       ORDER BY COUNT(*) DESC
       LIMIT 20`,
      [shopId],
    ),
    pool.query<{ avg: string | null }>(
      `SELECT AVG((metadata->>'durationMs')::numeric) as avg
       FROM widget_events
       WHERE shop_id = $1 AND event_name = 'session_duration'`,
      [shopId],
    ),
  ]);

  return {
    events: eventsResult.rows.map((row) => ({ name: row.event_name, count: Number(row.count) })),
    buttons: buttonsResult.rows.map((row) => ({ label: row.label, count: Number(row.count) })),
    averageSessionDurationMs: durationResult.rows[0]?.avg ? Number(durationResult.rows[0].avg) : null,
  };
}
