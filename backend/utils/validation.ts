import { HttpError } from '../http/errors';

export function assertString(value: unknown, field: string, options: { minLength?: number; maxLength?: number } = {}): string {
  if (typeof value !== 'string') {
    throw new HttpError(400, `${field} должен быть строкой`);
  }
  const trimmed = value.trim();
  if (options.minLength && trimmed.length < options.minLength) {
    throw new HttpError(400, `${field} должен быть не короче ${options.minLength} символов`);
  }
  if (options.maxLength && trimmed.length > options.maxLength) {
    throw new HttpError(400, `${field} должен быть не длиннее ${options.maxLength} символов`);
  }
  return trimmed;
}

export function assertUuid(value: unknown, field: string): string {
  const text = assertString(value, field);
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(text)) {
    throw new HttpError(400, `${field} должен быть UUID`);
  }
  return text;
}

export function assertRecord(value: unknown, field: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new HttpError(400, `${field} должен быть объектом`);
  }
  return value as Record<string, unknown>;
}

export function assertArray(value: unknown, field: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new HttpError(400, `${field} должен быть массивом`);
  }
  return value;
}

export function assertBoolean(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') {
    throw new HttpError(400, `${field} должен быть true или false`);
  }
  return value;
}

export function assertNumber(value: unknown, field: string): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new HttpError(400, `${field} должен быть числом`);
  }
  return value;
}

export function assertOneOf<T extends string>(value: unknown, field: string, allowed: readonly T[]): T {
  const text = assertString(value, field);
  if (!allowed.includes(text as T)) {
    throw new HttpError(400, `${field} должен быть одним из значений: ${allowed.join(', ')}`);
  }
  return text as T;
}
