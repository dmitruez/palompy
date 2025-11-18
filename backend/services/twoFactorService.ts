import crypto from 'crypto';
import { query } from '../db/postgres';
import { HttpError } from '../http/errors';
import { env } from '../config/env';

interface TwoFactorRow {
  user_id: number;
  two_factor_secret: string | null;
  two_factor_enabled: boolean;
  recovery_codes: string[] | null;
}

const OTP_WINDOW = 30; // seconds
const OTP_DIGITS = 6;
const RECOVERY_CODES_COUNT = 10;

export async function requestTwoFactorSetup(userId: number): Promise<{
  secret: string;
  otpauthUrl: string;
  recoveryCodes: string[];
}> {
  const current = await getTwoFactorRow(userId);
  if (current?.two_factor_enabled) {
    throw new HttpError(400, 'Двухфакторная аутентификация уже включена');
  }
  const secret = current?.two_factor_secret
    ? decryptSecret(current.two_factor_secret)
    : generateSecret();
  const recoveryCodes = current?.recovery_codes ?? generateRecoveryCodes();
  await upsertTwoFactorRow(userId, secret, false, recoveryCodes);
  return {
    secret,
    otpauthUrl: buildOtpAuthUrl(secret, userId),
    recoveryCodes,
  };
}

export async function enableTwoFactor(userId: number, token: string): Promise<void> {
  const current = await getTwoFactorRow(userId);
  if (!current || !current.two_factor_secret) {
    throw new HttpError(400, 'Запросите секрет перед включением 2FA');
  }
  const secret = decryptSecret(current.two_factor_secret);
  if (!verifyTotp(secret, token)) {
    throw new HttpError(400, 'Неверный одноразовый код');
  }
  await upsertTwoFactorRow(userId, secret, true, current.recovery_codes ?? generateRecoveryCodes());
}

export async function verifyTwoFactor(userId: number, token: string): Promise<boolean> {
  const current = await getTwoFactorRow(userId);
  if (!current?.two_factor_enabled || !current.two_factor_secret) {
    return true;
  }
  const secret = decryptSecret(current.two_factor_secret);
  if (verifyTotp(secret, token)) {
    return true;
  }
  return useRecoveryCode(userId, token, current.recovery_codes ?? []);
}

async function useRecoveryCode(userId: number, token: string, codes: string[]): Promise<boolean> {
  if (!codes.length) {
    return false;
  }
  const normalized = token.toLowerCase();
  const match = codes.find((code) => code === normalized);
  if (!match) {
    return false;
  }
  const remaining = codes.filter((code) => code !== match);
  await query('UPDATE user_security_settings SET recovery_codes = $2, updated_at = NOW() WHERE user_id = $1', [
    userId,
    remaining,
  ]);
  return true;
}

async function getTwoFactorRow(userId: number): Promise<TwoFactorRow | null> {
  const result = await query<TwoFactorRow>(
    'SELECT user_id, two_factor_secret, two_factor_enabled, recovery_codes FROM user_security_settings WHERE user_id = $1',
    [userId],
  );
  return result.rows[0] ?? null;
}

async function upsertTwoFactorRow(
  userId: number,
  secret: string,
  enabled: boolean,
  recoveryCodes: string[],
): Promise<void> {
  const encrypted = encryptSecret(secret);
  await query(
    `INSERT INTO user_security_settings (user_id, two_factor_secret, two_factor_enabled, recovery_codes)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id) DO UPDATE SET
       two_factor_secret = EXCLUDED.two_factor_secret,
       two_factor_enabled = EXCLUDED.two_factor_enabled,
       recovery_codes = EXCLUDED.recovery_codes,
       updated_at = NOW()`,
    [userId, encrypted, enabled, recoveryCodes],
  );
}

function generateSecret(): string {
  return base32Encode(crypto.randomBytes(20));
}

function buildOtpAuthUrl(secret: string, userId: number): string {
  const label = encodeURIComponent(`palompy:${userId}`);
  const issuer = encodeURIComponent('palompy');
  return `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&digits=${OTP_DIGITS}`;
}

function generateRecoveryCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < RECOVERY_CODES_COUNT; i += 1) {
    codes.push(crypto.randomBytes(4).toString('hex'));
  }
  return codes;
}

function verifyTotp(secret: string, token: string): boolean {
  const code = token.replace(/\s+/g, '');
  if (!/^\d{6}$/.test(code) && !/^[a-f0-9]{8}$/i.test(code)) {
    return false;
  }
  const currentStep = Math.floor(Date.now() / 1000 / OTP_WINDOW);
  for (let offset = -1; offset <= 1; offset += 1) {
    const expected = generateTotp(secret, currentStep + offset);
    if (expected === code) {
      return true;
    }
  }
  return false;
}

function generateTotp(secret: string, step: number): string {
  const key = base32Decode(secret);
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(step));
  const hmac = crypto.createHmac('sha1', key).update(buffer).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code = (hmac.readUInt32BE(offset) & 0x7fffffff) % 10 ** OTP_DIGITS;
  return code.toString().padStart(OTP_DIGITS, '0');
}

function encryptSecret(secret: string): string {
  const key = crypto.createHash('sha256').update(env.twoFactorEncryptionKey).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function decryptSecret(payload: string): string {
  const raw = Buffer.from(payload, 'base64');
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const encrypted = raw.subarray(28);
  const key = crypto.createHash('sha256').update(env.twoFactorEncryptionKey).digest();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

function base32Decode(input: string): Buffer {
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of input.toUpperCase()) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) {
      continue;
    }
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}
