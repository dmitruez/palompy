import dotenv from 'dotenv';

dotenv.config();

const requiredVars = ['OPENAI_API_KEY', 'DATABASE_URL'] as const;

type RequiredVar = typeof requiredVars[number];

function getEnvVariable(key: RequiredVar): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  openaiApiKey: getEnvVariable('OPENAI_API_KEY'),
  databaseUrl: getEnvVariable('DATABASE_URL'),
  port: Number(process.env.PORT ?? 4000),
  openAiModel: process.env.OPENAI_MODEL ?? 'gpt-4.1-mini',
  embeddingModel: process.env.EMBEDDING_MODEL ?? 'text-embedding-3-small',
};
