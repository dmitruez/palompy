import { ChatLogMetadata } from '../models/chatLog';
import { Shop } from '../models/shop';
import { getDatabase, nextId, persistDatabase } from '../storage/database';
import { detectLanguage, SupportedLanguage } from '../utils/detectLanguage';
import { searchRelevantChunks } from './knowledgeService';
import { LeadCaptureData } from '../models/chatLead';
import { OpenAIChatMessage, requestLeadAwareResponse } from './openaiService';

const HISTORY_LIMIT = 6;
const CONTEXT_LIMIT = 1800;

export type ChatMetadata = ChatLogMetadata;

interface ChatPayload {
  shop: Shop;
  message: string;
  sessionId: string;
  language?: SupportedLanguage;
  metadata?: ChatMetadata;
}

export interface ChatResult {
  answer: string;
  collectedData: LeadCaptureData | null;
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

function buildSystemPrompt(shop: Shop, language: SupportedLanguage): string {
  const base =
    language === 'ru'
      ? `Ты — ассистент Palompy для магазина "${shop.name}". Отвечай дружелюбно, на русском языке. ` +
        'Опирайся на контекст магазина, помогай с подбором товаров, доставкой и возвратами.'
      : `You are the Palompy assistant for the store "${shop.name}". Reply in English. ` +
        'Use the provided context to help with product selection, delivery, and returns.';

  const leadInstructions =
    language === 'ru'
      ? 'Всегда уточняй имя, контакт (телефон или email), номер заказа и интересующий товар, если это поможет решить вопрос.'
      : 'Always ask for the customer name, contact (phone or email), order number, and product of interest when it helps solve the request.';

  const formatHint =
    'Верни JSON с ключами "answer" (текст ответа) и "collected_data" (объект с полями name, email, phone, intent, orderNumber, preferredContact, notes). ' +
    'В каждом поле используй строку или null.';

  const formatHintEn =
    'Return JSON with keys "answer" and "collected_data" (object fields: name, email, phone, intent, orderNumber, preferredContact, notes). ' +
    'Every field must be a string or null.';

  return `${base}\n${leadInstructions}\n${language === 'ru' ? formatHint : formatHintEn}`;
}

function buildContextSummary(texts: string[]): string {
  if (!texts.length) {
    return '';
  }
  const combined = texts.join('\n');
  if (combined.length <= CONTEXT_LIMIT) {
    return combined;
  }
  return `${combined.slice(0, CONTEXT_LIMIT)}…`;
}

function buildMetadataPrompt(metadata: ChatMetadata | undefined, language: SupportedLanguage): string | null {
  if (!metadata) {
    return null;
  }
  const entries: string[] = [];
  if (metadata.pageTitle) {
    entries.push(`Page title: ${metadata.pageTitle}`);
  }
  if (metadata.pageUrl) {
    entries.push(`Page URL: ${metadata.pageUrl}`);
  }
  if (!entries.length) {
    return null;
  }
  const prefix =
    language === 'ru'
      ? 'Дополнительные данные о пользователе'
      : 'Additional user context';
  return `${prefix}: ${entries.join(' | ')}`;
}

function loadHistory(shopId: number, sessionId: string): { user: string; bot: string }[] {
  const db = getDatabase();
  return db.chat_logs
    .filter((log) => log.shop_id === shopId && log.session_id === sessionId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .slice(-HISTORY_LIMIT)
    .map((log) => ({ user: log.user_message, bot: log.assistant_answer }));
}

export async function handleChatMessage(payload: ChatPayload): Promise<ChatResult> {
  const language = payload.language ?? detectLanguage(payload.message);
  const chunks = await searchRelevantChunks(payload.shop.id, payload.message, 5);
  const contextText = buildContextSummary(
    chunks.map((chunk, index) => `[#${index + 1}] ${chunk.text}`),
  );

  const messages: OpenAIChatMessage[] = [
    { role: 'system', content: buildSystemPrompt(payload.shop, language) },
  ];
  if (contextText) {
    const contextMessage =
      language === 'ru'
        ? `Контекст базы знаний магазина:\n${contextText}`
        : `Store knowledge base context:\n${contextText}`;
    messages.push({ role: 'system', content: contextMessage });
  }
  const metadataPrompt = buildMetadataPrompt(payload.metadata, language);
  if (metadataPrompt) {
    messages.push({ role: 'system', content: metadataPrompt });
  }

  for (const entry of loadHistory(payload.shop.id, payload.sessionId)) {
    messages.push({ role: 'user', content: entry.user });
    messages.push({ role: 'assistant', content: entry.bot });
  }

  messages.push({ role: 'user', content: payload.message });

  let collectedData: LeadCaptureData | null = null;
  let answer = '';

  try {
    const aiResult = await requestLeadAwareResponse(messages);
    answer = aiResult.answer;
    collectedData = aiResult.collectedData;
  } catch (error) {
    console.error('[palompy] openai error', error);
  }

  if (!answer) {
    if (chunks.length > 0) {
      answer = formatAnswer(language, chunks[0].text);
    } else {
      answer = fallbackAnswer(language);
    }
  }

  const db = getDatabase();
  db.chat_logs.push({
    id: nextId(db.chat_logs),
    shop_id: payload.shop.id,
    session_id: payload.sessionId,
    user_message: payload.message,
    assistant_answer: answer,
    context_used: contextText || null,
    metadata: payload.metadata ?? null,
    collected_profile: collectedData ?? null,
    created_at: new Date().toISOString(),
  });
  persistDatabase();

  return { answer, collectedData };
}
