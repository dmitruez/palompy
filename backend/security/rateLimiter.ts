import net from 'net';
import { URL } from 'url';
import { env } from '../config/env';
import { HttpError } from '../http/errors';

interface RateLimiterStore {
  increment(key: string, windowMs: number): Promise<number>;
}

function parseRedisUrl(connectionString: string): {
  host: string;
  port: number;
  password?: string;
} | null {
  if (!connectionString) {
    return null;
  }
  try {
    const url = new URL(connectionString);
    return {
      host: url.hostname,
      port: url.port ? Number(url.port) : 6379,
      password: url.password || undefined,
    };
  } catch (error) {
    console.warn('Некорректный REDIS_URL', error);
    return null;
  }
}

class RedisStore implements RateLimiterStore {
  private readonly config = parseRedisUrl(env.redisUrl);

  async increment(key: string, windowMs: number): Promise<number> {
    if (!this.config) {
      throw new Error('Redis не настроен');
    }
    const count = await this.sendCommand<number>('INCR', key);
    if (count === 1) {
      await this.sendCommand<string>('PEXPIRE', key, windowMs.toString());
    }
    return count;
  }

  private sendCommand<T>(command: string, ...args: string[]): Promise<T> {
    const config = this.config;
    if (!config) {
      return Promise.reject(new Error('Redis config missing'));
    }
    return new Promise<T>((resolve, reject) => {
      const socket = net.createConnection({ host: config.host, port: config.port });
      const payloadParts: string[] = [];
      if (config.password) {
        payloadParts.push(this.buildRequest('AUTH', [config.password]));
      }
      payloadParts.push(this.buildRequest(command, args));
      const payload = payloadParts.join('');
      let response = '';
      socket.on('connect', () => {
        socket.write(payload);
      });
      socket.on('data', (chunk) => {
        response += chunk.toString('utf8');
        if (response.endsWith('\r\n')) {
          socket.end();
        }
      });
      socket.on('end', () => {
        try {
          const replies = this.parseResponses(response);
          resolve(replies[replies.length - 1] as T);
        } catch (error) {
          reject(error);
        }
      });
      socket.on('error', (error) => {
        reject(error);
      });
    });
  }

  private buildRequest(command: string, args: string[]): string {
    const allArgs = [command, ...args];
    const parts = allArgs.map((arg) => `$${Buffer.byteLength(arg)}\r\n${arg}\r\n`);
    return `*${allArgs.length}\r\n${parts.join('')}`;
  }

  private parseResponses(raw: string): unknown[] {
    if (!raw) {
      throw new Error('Пустой ответ Redis');
    }
    const results: unknown[] = [];
    let cursor = 0;
    while (cursor < raw.length) {
      if (raw[cursor] === '\r' || raw[cursor] === '\n') {
        cursor += 1;
        continue;
      }
      const indicator = raw[cursor];
      if (indicator === '+') {
        const end = raw.indexOf('\r\n', cursor);
        results.push(raw.slice(cursor + 1, end));
        cursor = end + 2;
        continue;
      }
      if (indicator === ':') {
        const end = raw.indexOf('\r\n', cursor);
        results.push(Number(raw.slice(cursor + 1, end)));
        cursor = end + 2;
        continue;
      }
      if (indicator === '-') {
        const end = raw.indexOf('\r\n', cursor);
        throw new Error(raw.slice(cursor + 1, end));
      }
      if (indicator === '$') {
        const lengthEnd = raw.indexOf('\r\n', cursor);
        const length = Number(raw.slice(cursor + 1, lengthEnd));
        if (length === -1) {
          results.push(null);
          cursor = lengthEnd + 2;
        } else {
          const start = lengthEnd + 2;
          const value = raw.slice(start, start + length);
          results.push(value);
          cursor = start + length + 2;
        }
        continue;
      }
      if (indicator === '*') {
        // массивы нам не нужны, пропускаем
        const lengthEnd = raw.indexOf('\r\n', cursor);
        cursor = lengthEnd + 2;
        continue;
      }
      cursor += 1;
    }
    return results;
  }
}

class MemoryStore implements RateLimiterStore {
  private readonly buckets = new Map<string, { count: number; expiresAt: number }>();

  async increment(key: string, windowMs: number): Promise<number> {
    const now = Date.now();
    const existing = this.buckets.get(key);
    if (!existing || existing.expiresAt <= now) {
      this.buckets.set(key, { count: 1, expiresAt: now + windowMs });
      return 1;
    }
    existing.count += 1;
    return existing.count;
  }
}

const store: RateLimiterStore = env.redisUrl ? new RedisStore() : new MemoryStore();
const fallbackStore = new MemoryStore();

export async function enforceRateLimit(identifier: string): Promise<void> {
  if (!identifier) {
    throw new HttpError(400, 'Не удалось определить идентификатор клиента для rate-limit');
  }
  try {
    const count = await store.increment(identifier, env.rateLimitWindowMs);
    if (count > env.rateLimitMaxRequests) {
      throw new HttpError(429, 'Превышен лимит запросов. Повторите попытку позже.');
    }
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    console.warn('Rate limiter degraded, переключаемся на in-memory store', error);
    const count = await fallbackStore.increment(identifier, env.rateLimitWindowMs);
    if (count > env.rateLimitMaxRequests) {
      throw new HttpError(429, 'Превышен лимит запросов. Повторите попытку позже.');
    }
  }
}
