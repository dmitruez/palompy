import { query } from '../db/postgres';
import { RequestMetric } from '../models/metric';

const BATCH_SIZE = 25;
const FLUSH_INTERVAL_MS = 5_000;

const buffer: RequestMetric[] = [];
let flushing = false;

export function enqueueRequestMetric(metric: RequestMetric): void {
  buffer.push(metric);
  if (buffer.length >= BATCH_SIZE) {
    void flushBuffer();
  }
}

async function flushBuffer(): Promise<void> {
  if (flushing || buffer.length === 0) {
    return;
  }
  flushing = true;
  const batch = buffer.splice(0, buffer.length);
  try {
    const values: unknown[] = [];
    const placeholders = batch
      .map((metric, index) => {
        const offset = index * 7;
        values.push(
          metric.method,
          metric.path,
          metric.statusCode,
          metric.durationMs,
          metric.userId ?? null,
          metric.plan ?? null,
          metric.metadata ?? {},
        );
        return `('request', $${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`;
      })
      .join(', ');
    await query(
      `INSERT INTO metrics (type, method, path, status_code, duration_ms, user_id, plan, metadata)
       VALUES ${placeholders}`,
      values,
    );
  } catch (error) {
    console.error('Failed to persist request metrics batch', error);
  } finally {
    flushing = false;
  }
}

const flushTimer = setInterval(() => {
  void flushBuffer();
}, FLUSH_INTERVAL_MS);

if (typeof (flushTimer as { unref?: () => void }).unref === 'function') {
  (flushTimer as { unref?: () => void }).unref!();
}
