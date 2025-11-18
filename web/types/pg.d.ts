declare module 'pg' {
  export class Pool {
    constructor(config?: Record<string, unknown>);
    query<T = unknown>(text: string, params?: unknown[]): Promise<{ rows: T[]; rowCount: number }>;
    end(): Promise<void>;
  }
}
