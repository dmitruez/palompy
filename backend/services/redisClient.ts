interface RedisLike {
  incr(key: string): Promise<number>;
  incrby?(key: string, value: number): Promise<number>;
  hincrby?(key: string, field: string, value: number): Promise<number>;
}

class InMemoryRedis implements RedisLike {
  private counters = new Map<string, number>();

  private hashes = new Map<string, Map<string, number>>();

  async incr(key: string): Promise<number> {
    return this.incrby(key, 1);
  }

  async incrby(key: string, value: number): Promise<number> {
    const next = (this.counters.get(key) ?? 0) + value;
    this.counters.set(key, next);
    return next;
  }

  async hincrby(key: string, field: string, value: number): Promise<number> {
    const hash = this.hashes.get(key) ?? new Map<string, number>();
    const next = (hash.get(field) ?? 0) + value;
    hash.set(field, next);
    this.hashes.set(key, hash);
    return next;
  }
}

let client: RedisLike | null = null;

export function getRedisClient(): RedisLike {
  if (client) {
    return client;
  }
  const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
  try {
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
    const Redis = require('ioredis');
    client = new Redis(redisUrl) as RedisLike;
  } catch (error) {
    console.warn('ioredis is not installed or Redis server is unavailable. Using in-memory counters for metrics.');
    client = new InMemoryRedis();
  }
  return client;
}
