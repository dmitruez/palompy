import { RouteDefinition } from '../http/types';
import { json } from '../http/responses';
import { HttpError } from '../http/errors';
import { createSurveyResponse, getSurveyById } from '../services/surveyService';
import { assertRecord, assertString } from '../utils/validation';

function normalizeAnswers(value: unknown): Record<string, string | string[]> {
  const record = assertRecord(value, 'answers');
  const entries = Object.entries(record);
  if (!entries.length) {
    throw new HttpError(400, 'Нужно заполнить хотя бы один ответ');
  }
  const normalized: Record<string, string | string[]> = {};
  for (const [key, raw] of entries) {
    if (typeof raw === 'string') {
      normalized[key] = raw.trim();
      continue;
    }
    if (Array.isArray(raw) && raw.every((item) => typeof item === 'string')) {
      normalized[key] = raw.map((item) => item.trim());
      continue;
    }
    throw new HttpError(400, `answers.${key} должен быть строкой или массивом строк`);
  }
  return normalized;
}

const routes: RouteDefinition[] = [
  {
    method: 'POST',
    path: '/api/surveys/:surveyId/responses',
    handler: async ({ request }) => {
      const surveyId = Number(request.params.surveyId);
      if (!Number.isFinite(surveyId)) {
        throw new HttpError(400, 'Некорректный идентификатор опроса');
      }
      const survey = await getSurveyById(surveyId);
      if (!survey || survey.status === 'archived') {
        throw new HttpError(404, 'Опрос не найден');
      }
      const body = assertRecord(request.body, 'body');
      const sessionId = assertString(body.sessionId, 'sessionId', { minLength: 8 });
      const answers = normalizeAnswers(body.answers);
      const metadata = body.metadata ? assertRecord(body.metadata, 'metadata') : undefined;
      await createSurveyResponse(survey.id, sessionId, answers, metadata);
      return json({ ok: true }, 201);
    },
  },
];

export default routes;
