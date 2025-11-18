import fs from 'fs';
import path from 'path';

type SecretsMap = Record<string, string>;

function loadDotEnv(): void {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    return;
  }
  const content = fs.readFileSync(envPath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }
    const [key, ...rest] = line.split('=');
    if (!key) {
      continue;
    }
    const value = rest.join('=').trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadDotEnv();

function loadSecretsFile(): SecretsMap | null {
  const secretsFile = process.env.SECRETS_MANAGER_FILE;
  if (!secretsFile || !fs.existsSync(secretsFile)) {
    return null;
  }
  try {
    const payload = fs.readFileSync(secretsFile, 'utf8');
    const parsed = JSON.parse(payload) as SecretsMap;
    return parsed;
  } catch (error) {
    console.warn('Не удалось прочитать файл с секретами', error);
    return null;
  }
}

const cachedSecrets = loadSecretsFile();

function readSecretFromFile(filePath?: string): string | undefined {
  if (!filePath) {
    return undefined;
  }
  try {
    if (!fs.existsSync(filePath)) {
      return undefined;
    }
    return fs.readFileSync(filePath, 'utf8').trim();
  } catch (error) {
    console.warn(`Не удалось прочитать секрет из файла ${filePath}`, error);
    return undefined;
  }
}

function resolveSecret(options: {
  inline?: string;
  filePath?: string;
  secretName?: string;
  defaultValue?: string;
}): string {
  if (options.inline) {
    return options.inline;
  }
  const fileSecret = readSecretFromFile(options.filePath);
  if (fileSecret) {
    return fileSecret;
  }
  if (options.secretName && cachedSecrets && cachedSecrets[options.secretName]) {
    return cachedSecrets[options.secretName];
  }
  return options.defaultValue ?? '';
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  dataFilePath: process.env.DATA_FILE ?? path.join(process.cwd(), 'data', 'db.json'),
  openaiApiKey: process.env.OPENAI_API_KEY ?? '',
  openaiModel: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
  openaiBaseUrl: process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
  databaseUrl: process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/postgres',
  apiJwtSecret: process.env.API_JWT_SECRET ?? 'change-me',
  thirdPartyApiBaseUrl: process.env.THIRD_PARTY_API_BASE_URL ?? 'https://example.com/api/',
  thirdPartyApiKey: resolveSecret({
    inline: process.env.THIRD_PARTY_API_KEY,
    filePath: process.env.THIRD_PARTY_API_KEY_FILE,
    secretName: process.env.THIRD_PARTY_API_KEY_SECRET_NAME,
    defaultValue: '',
  }),
  redisUrl: process.env.REDIS_URL ?? '',
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000),
  rateLimitMaxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 120),
  csrfTokenTtlMs: Number(process.env.CSRF_TOKEN_TTL_MS ?? 15 * 60 * 1000),
  twoFactorEncryptionKey: resolveSecret({
    inline: process.env.TWO_FACTOR_ENCRYPTION_KEY,
    filePath: process.env.TWO_FACTOR_ENCRYPTION_KEY_FILE,
    secretName: process.env.TWO_FACTOR_ENCRYPTION_KEY_SECRET_NAME,
    defaultValue: 'change-me-in-prod',
  }),
};
