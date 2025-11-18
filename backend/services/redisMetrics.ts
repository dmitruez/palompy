import { getRedisClient } from './redisClient';

const TOTAL_KEY = 'metrics:requests:total';
const ROUTE_KEY = 'metrics:requests:routes';
const STATUS_KEY = 'metrics:requests:status';

export async function bumpRedisCounters(method: string, path: string, statusCode: number): Promise<void> {
  const redis = getRedisClient();
  const normalizedPath = path || '/';
  try {
    await Promise.all([
      typeof redis.incrby === 'function' ? redis.incrby(TOTAL_KEY, 1) : redis.incr(TOTAL_KEY),
      redis.hincrby ? redis.hincrby(ROUTE_KEY, `${method} ${normalizedPath}`, 1) : Promise.resolve(),
      redis.hincrby ? redis.hincrby(STATUS_KEY, String(statusCode), 1) : Promise.resolve(),
    ]);
  } catch (error) {
    console.warn('Failed to update Redis metrics counters', error);
  }
}
