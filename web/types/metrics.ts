export interface VisitorBucket {
  date: string;
  count: number;
}

export interface ClickFrequency {
  action: string;
  count: number;
}

export interface PlanUsage {
  plan: string;
  label: string;
  used: number;
  limit: number;
  requestCount: number;
}

export interface MetricsSummary {
  totals: {
    requests: number;
    avgResponseMs: number;
    clicks: number;
  };
  visitorsByDay: VisitorBucket[];
  clickFrequency: ClickFrequency[];
  planUsage: PlanUsage[];
}
