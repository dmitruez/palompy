import { env } from '../config/env';
import { LeadCaptureData } from '../models/chatLead';

export type OpenAIChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export interface LeadCaptureResult {
  answer: string;
  collectedData: LeadCaptureData | null;
  raw: unknown;
}

const OPENAI_PATH = '/chat/completions';

function sanitizeString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeLeadData(raw: unknown): LeadCaptureData | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const record = raw as Record<string, unknown>;
  const normalized: LeadCaptureData = {
    name: sanitizeString(record.name),
    email: sanitizeString(record.email),
    phone: sanitizeString(record.phone ?? record.phoneNumber),
    intent: sanitizeString(record.intent ?? record.goal ?? record.purpose),
    orderNumber: sanitizeString(record.orderNumber ?? record.order_id ?? record.order),
    preferredContact: sanitizeString(record.preferredContact ?? record.contact ?? record.contactMethod),
    notes: sanitizeString(record.notes ?? record.summary ?? record.comment),
  };
  const hasValue = Object.values(normalized).some((value) => Boolean(value));
  return hasValue ? normalized : null;
}

function getBaseUrl(): string {
  return env.openaiBaseUrl.replace(/\/$/, '');
}

export async function requestLeadAwareResponse(
  messages: OpenAIChatMessage[],
  options: { temperature?: number } = {},
): Promise<LeadCaptureResult> {
  if (!env.openaiApiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const payload = {
    model: env.openaiModel,
    temperature: options.temperature ?? 0.2,
    response_format: { type: 'json_object' },
    messages,
  };

  const response = await fetch(`${getBaseUrl()}${OPENAI_PATH}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.openaiApiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as Record<string, unknown>;
  const choices = (data.choices as Array<Record<string, unknown>>) ?? [];
  if (!choices.length) {
    throw new Error('OpenAI API returned an empty response');
  }
  const message = (choices[0]?.message ?? {}) as Record<string, unknown>;
  const content = (() => {
    const rawContent = message.content;
    if (typeof rawContent === 'string') {
      return rawContent;
    }
    if (Array.isArray(rawContent)) {
      return rawContent.map((part) => (typeof part === 'string' ? part : part?.text ?? '')).join('\n');
    }
    return '';
  })();

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(content) as Record<string, unknown>;
  } catch (error) {
    throw new Error(`OpenAI response is not valid JSON: ${(error as Error).message}`);
  }

  const answer = sanitizeString(parsed.answer) ?? '';
  const collectedData = normalizeLeadData(
    parsed.collected_data ?? parsed.lead ?? parsed.profile ?? parsed.extracted_data,
  );

  return {
    answer,
    collectedData,
    raw: parsed,
  };
}
