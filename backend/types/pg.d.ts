declare module 'pg' {
  import { EventEmitter } from 'events';

  export interface QueryResult<T = unknown> {
    rows: T[];
  }

  export interface PoolConfig {
    connectionString?: string;
  }

  export class Pool extends EventEmitter {
    constructor(config?: PoolConfig);
    query<T = unknown>(text: string, params?: unknown[]): Promise<QueryResult<T>>;
    end(): Promise<void>;
  }
}
