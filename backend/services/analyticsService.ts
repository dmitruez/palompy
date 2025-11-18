import { AnalyticsSummary } from '../models/analytics';
import { getDatabase, nextId, persistDatabase } from '../storage/database';

interface RecordEventPayload {
  shopId: number;
  sessionId: string;
  eventName: string;
  metadata?: Record<string, unknown>;
}

export async function recordWidgetEvent(payload: RecordEventPayload): Promise<void> {
  const db = getDatabase();
  db.widget_events.push({
    id: nextId(db.widget_events),
    shop_id: payload.shopId,
    session_id: payload.sessionId,
    event_name: payload.eventName,
    metadata: payload.metadata ?? null,
    created_at: new Date().toISOString(),
  });
  persistDatabase();
}

function countBy<T>(items: T[], selector: (item: T) => string): { name: string; count: number }[] {
  const map = new Map<string, number>();
  for (const item of items) {
    const key = selector(item);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getAnalyticsSummary(shopId: number): Promise<AnalyticsSummary> {
  const db = getDatabase();
  const events = db.widget_events.filter((event) => event.shop_id === shopId);

  const eventSummary = countBy(events, (event) => event.event_name).slice(0, 50);
  const buttonSummary = countBy(
    events.filter((event) => {
      if (!event.metadata) {
        return false;
      }
      return Boolean((event.metadata as Record<string, unknown>).label ?? (event.metadata as Record<string, unknown>).buttonId);
    }),
    (event) => {
      const metadata = event.metadata as Record<string, string>;
      return metadata.label ?? metadata.buttonId ?? event.event_name;
    },
  ).slice(0, 20);

  const durations = events
    .map((event) => {
      if (event.event_name !== 'session_duration' || !event.metadata) {
        return null;
      }
      const duration = Number((event.metadata as Record<string, unknown>).durationMs);
      return Number.isFinite(duration) ? duration : null;
    })
    .filter((value): value is number => value !== null);

  const averageSessionDurationMs = durations.length
    ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)
    : null;

  return {
    events: eventSummary,
    buttons: buttonSummary.map((entry) => ({ label: entry.name, count: entry.count })),
    averageSessionDurationMs,
  };
}
