import { getDatabase, nextId, persistDatabase } from '../storage/database';
import { detectLanguage, SupportedLanguage } from '../utils/detectLanguage';
import { searchRelevantChunks } from './knowledgeService';

interface ChatPayload {
  shopId: number;
  message: string;
  sessionId: string;
  language?: SupportedLanguage;
}

function fallbackAnswer(language: SupportedLanguage): string {
  return language === 'ru'
    ? 'Пока не вижу ответа в базе магазина. Напишите, пожалуйста, в поддержку.'
    : 'I could not find that information in the store knowledge base. Please reach out to support.';
}

function formatAnswer(language: SupportedLanguage, chunkText: string): string {
  if (language === 'ru') {
    return `Нашёл информацию: ${chunkText}`;
  }
  return `Here is what I found: ${chunkText}`;
}

export async function handleChatMessage(payload: ChatPayload): Promise<string> {
  const language = payload.language ?? detectLanguage(payload.message);
  const chunks = await searchRelevantChunks(payload.shopId, payload.message, 5);
  const context = chunks.map((chunk, index) => `[#${index + 1}] ${chunk.text}`).join('\n');

  const answer = chunks.length > 0 ? formatAnswer(language, chunks[0].text) : fallbackAnswer(language);

  const db = getDatabase();
  db.chat_logs.push({
    id: nextId(db.chat_logs),
    shop_id: payload.shopId,
    session_id: payload.sessionId,
    user_message: payload.message,
    assistant_answer: answer,
    context_used: context || null,
    created_at: new Date().toISOString(),
  });
  persistDatabase();

  return answer;
}
