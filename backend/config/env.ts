import fs from 'fs';
import path from 'path';

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

export const env = {
  port: Number(process.env.PORT ?? 4000),
  dataFilePath: process.env.DATA_FILE ?? path.join(process.cwd(), 'data', 'db.json'),
  openaiApiKey: process.env.OPENAI_API_KEY ?? '',
  openaiModel: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
  openaiBaseUrl: process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
  databaseUrl: process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/postgres',
  apiJwtSecret: process.env.API_JWT_SECRET ?? 'change-me',
  thirdPartyApiBaseUrl: process.env.THIRD_PARTY_API_BASE_URL ?? 'https://example.com/api/',
  thirdPartyApiKey: process.env.THIRD_PARTY_API_KEY ?? '',
};
