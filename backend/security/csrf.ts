import crypto from 'crypto';
import { env } from '../config/env';
import { HttpError } from '../http/errors';

interface TokenEntry {
  token: string;
  expiresAt: number;
}

const store = new Map<string, TokenEntry>();
let lastCleanup = Date.now();
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

function cleanupExpiredTokens(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) {
    return;
  }
  lastCleanup = now;
  for (const [sessionId, entry] of store.entries()) {
    if (entry.expiresAt <= now) {
      store.delete(sessionId);
    }
  }
}

export function issueCsrfToken(sessionId: string): { token: string; expiresAt: number } {
  cleanupExpiredTokens();
  const expiresAt = Date.now() + env.csrfTokenTtlMs;
  const token = crypto.randomBytes(32).toString('hex');
  store.set(sessionId, { token, expiresAt });
  return { token, expiresAt };
}

export function requireCsrfToken(sessionId: string | undefined, token: string | undefined): void {
  if (!sessionId) {
    throw new HttpError(400, 'X-Session-Id обязателен для защищённых запросов');
  }
  if (!token) {
    throw new HttpError(403, 'Не передан CSRF-токен');
  }
  cleanupExpiredTokens();
  const entry = store.get(sessionId);
  if (!entry || entry.expiresAt <= Date.now()) {
    throw new HttpError(403, 'CSRF-токен истёк, запросите новый');
  }
  if (entry.token !== token) {
    throw new HttpError(403, 'Неверный CSRF-токен');
  }
}
