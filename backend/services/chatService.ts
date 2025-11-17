import { pool } from '../config/db';
import { openai } from '../config/openai';
import { env } from '../config/env';
import { detectLanguage, SupportedLanguage } from '../utils/detectLanguage';
import { searchRelevantChunks } from './knowledgeService';

interface ChatPayload {
  shopId: number;
  message: string;
  sessionId: string;
  language?: SupportedLanguage;
}

function systemPrompt(language: SupportedLanguage): string {
  if (language === 'ru') {
    return `Ты — вежливый ассистент интернет-магазина. Отвечай кратко, по делу и по-русски.
Если ответа нет в данных магазина, скажи честно, что информации нет и предложи связаться с человеком.`;
  }
  return `You are a polite shopping assistant for an online store. Reply in concise English.
If the knowledge base does not contain the answer, admit it and suggest contacting human support.`;
}

function formatContext(
  chunks: { text: string; source_type: string; source_id: string | null }[],
  language: SupportedLanguage,
): string {
  if (!chunks.length) {
    return language === 'ru' ? 'Контекст отсутствует.' : 'No additional knowledge available.';
  }
  return chunks
    .map((chunk, index) => {
      const labelPrefix = language === 'ru' ? 'Документ' : 'Document';
      const source = chunk.source_type + (chunk.source_id ? `:${chunk.source_id}` : '');
      return `[[${labelPrefix} ${index + 1} / ${source}]]\n${chunk.text}`;
    })
    .join('\n\n');
}

function fallbackAnswer(language: SupportedLanguage): string {
  return language === 'ru'
    ? 'Пока не могу найти информацию. Напишите, пожалуйста, в поддержку магазина.'
    : 'I could not find that information right now. Please contact store support.';
}

export async function handleChatMessage(payload: ChatPayload): Promise<string> {
  const language = payload.language ?? detectLanguage(payload.message);
  const chunks = await searchRelevantChunks(payload.shopId, payload.message, 5);
  const context = formatContext(chunks, language);
  const contextLabel = language === 'ru' ? 'Контекст магазина' : 'Store knowledge';

  let answer = fallbackAnswer(language);

  try {
    const completion = await openai.chat.completions.create({
      model: env.openAiModel,
      temperature: 0.4,
      messages: [
        { role: 'system', content: systemPrompt(language) },
        { role: 'system', content: `${contextLabel}:\n${context}` },
        { role: 'user', content: payload.message },
      ],
    });

    answer = completion.choices[0]?.message?.content?.trim() || fallbackAnswer(language);
  } catch (error) {
    console.error('chat completion failed', error);
  }

  await pool.query(
    `INSERT INTO chat_logs (shop_id, session_id, user_message, assistant_answer, context_used)
     VALUES ($1, $2, $3, $4, $5)`,
    [payload.shopId, payload.sessionId, payload.message, answer, context],
  );

  return answer;
}
