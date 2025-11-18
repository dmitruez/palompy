import crypto from 'crypto';
import { env } from './env';

interface TokenArgs {
  userId: number;
  subscriptionId: number;
  expiresAt: string;
}

function base64Url(value: Buffer | string): string {
  const buffer = typeof value === 'string' ? Buffer.from(value) : value;
  return buffer
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export function generateApiSessionToken({ userId, subscriptionId, expiresAt }: TokenArgs): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const exp = Math.floor(new Date(expiresAt).getTime() / 1000);
  const payload = {
    sub: String(userId),
    subscriptionId,
    iat: now,
    exp,
  };
  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto.createHmac('sha256', env.apiJwtSecret).update(data).digest();
  return `${data}.${base64Url(signature)}`;
}
