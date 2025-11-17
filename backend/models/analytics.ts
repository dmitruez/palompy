export interface WidgetEvent {
  id: number;
  shop_id: number;
  session_id: string;
  event_name: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface AnalyticsSummary {
  events: { name: string; count: number }[];
  buttons: { label: string; count: number }[];
  averageSessionDurationMs: number | null;
}
