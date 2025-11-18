import fs from 'fs';
import path from 'path';
import { env } from '../config/env';
import { Shop } from '../models/shop';
import { KnowledgeChunk } from '../models/knowledgeChunk';
import { ChatLog } from '../models/chatLog';
import { Survey, SurveyResponse } from '../models/survey';
import { WidgetEvent } from '../models/analytics';

export interface DatabaseSchema {
  shops: Shop[];
  knowledge_chunks: KnowledgeChunk[];
  chat_logs: ChatLog[];
  surveys: Survey[];
  survey_responses: SurveyResponse[];
  widget_events: WidgetEvent[];
}

const DEFAULT_DATA: DatabaseSchema = {
  shops: [
    {
      id: 1,
      name: 'Palompy Demo Shop',
      public_key: '11111111-2222-4444-8888-555555555555',
      created_at: new Date('2024-01-01T00:00:00.000Z').toISOString(),
    },
  ],
  knowledge_chunks: [
    {
      id: 1,
      shop_id: 1,
      source_type: 'faq',
      source_id: 'shipping',
      text: 'Доставка по России занимает 2-4 дня курьером. Самовывоз из пунктов выдачи доступен бесплатно.',
      created_at: new Date('2024-01-01T00:10:00.000Z').toISOString(),
    },
    {
      id: 2,
      shop_id: 1,
      source_type: 'policy',
      source_id: 'returns',
      text: 'Вы можете оформить возврат в течение 30 дней. Курьер заберёт заказ или можно отнести на почту.',
      created_at: new Date('2024-01-01T00:12:00.000Z').toISOString(),
    },
  ],
  chat_logs: [],
  surveys: [
    {
      id: 1,
      shop_id: 1,
      title: 'Как вам наш магазин?',
      description: 'Поделитесь впечатлением, это займёт минуту.',
      status: 'active',
      definition: {
        questions: [
          { id: 'experience', prompt: 'Как оцениваете работу ассистента?', type: 'single-choice', required: true, options: [
            { id: 'great', label: 'Отлично' },
            { id: 'ok', label: 'Нормально' },
            { id: 'bad', label: 'Нужно улучшить' },
          ] },
          { id: 'comment', prompt: 'Что можно улучшить?', type: 'text' },
        ],
      },
      created_at: new Date('2024-01-02T09:00:00.000Z').toISOString(),
    },
  ],
  survey_responses: [],
  widget_events: [],
};

function ensureDataFile(): void {
  const dir = path.dirname(env.dataFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(env.dataFilePath)) {
    fs.writeFileSync(env.dataFilePath, JSON.stringify(DEFAULT_DATA, null, 2));
  }
}

function loadDatabase(): DatabaseSchema {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(env.dataFilePath, 'utf8');
    const parsed = JSON.parse(raw) as DatabaseSchema;
    return parsed;
  } catch (error) {
    console.error('Failed to read database file, falling back to defaults', error);
    return { ...DEFAULT_DATA };
  }
}

const database = loadDatabase();

export function getDatabase(): DatabaseSchema {
  return database;
}

export function persistDatabase(): void {
  fs.writeFileSync(env.dataFilePath, JSON.stringify(database, null, 2));
}

export function nextId(collection: { id: number }[]): number {
  if (!collection.length) {
    return 1;
  }
  return Math.max(...collection.map((item) => item.id)) + 1;
}
