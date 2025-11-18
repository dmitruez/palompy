export interface RequestMetric {
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  userId?: number;
  plan?: string | null;
  metadata?: Record<string, unknown>;
}
