import crypto from 'crypto';

export interface JwtPayload {
  [key: string]: unknown;
  exp?: number;
  iat?: number;
}

interface SignOptions {
  expiresInSeconds?: number;
  subject?: string | number;
}

function base64UrlEncode(value: Buffer | string): string {
  const buffer = typeof value === 'string' ? Buffer.from(value) : value;
  return buffer
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(value: string): Buffer {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + pad, 'base64');
}

export function signJwt(payload: JwtPayload, secret: string, options: SignOptions = {}): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JwtPayload = { ...payload, iat: now };
  if (options.expiresInSeconds) {
    fullPayload.exp = now + options.expiresInSeconds;
  }
  if (options.subject) {
    fullPayload.sub = options.subject;
  }
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto.createHmac('sha256', secret).update(data).digest();
  const encodedSignature = base64UrlEncode(signature);
  return `${data}.${encodedSignature}`;
}

export function verifyJwt<T extends JwtPayload = JwtPayload>(token: string, secret: string): T {
  const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');
  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    throw new Error('Некорректный JWT');
  }
  const data = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = base64UrlEncode(crypto.createHmac('sha256', secret).update(data).digest());
  if (expectedSignature !== encodedSignature) {
    throw new Error('Недействительная подпись токена');
  }
  const payload = JSON.parse(base64UrlDecode(encodedPayload).toString('utf8')) as T;
  if (payload.exp && payload.exp * 1000 <= Date.now()) {
    throw new Error('Срок действия токена истёк');
  }
  return payload;
}
