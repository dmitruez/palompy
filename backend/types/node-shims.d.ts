declare module 'fs' {
  const value: any;
  export = value;
}

declare module 'path' {
  const value: any;
  export = value;
}

declare module 'http' {
  const value: any;
  export = value;
}

declare module 'crypto' {
  export function randomUUID(): string;
}

declare namespace NodeJS {
  interface Process {
    env: Record<string, string | undefined>;
    cwd(): string;
  }
}

declare const process: NodeJS.Process;

declare var console: {
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
};

declare class URLSearchParams {
  constructor(init?: string | Record<string, string> | string[][]);
  entries(): IterableIterator<[string, string]>;
}

declare class URL {
  constructor(input: string, base?: string);
  pathname: string;
  searchParams: URLSearchParams;
}

interface RequestInit {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

interface Response {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
  text(): Promise<string>;
}

declare function fetch(input: string, init?: RequestInit): Promise<Response>;

declare var __dirname: string;
