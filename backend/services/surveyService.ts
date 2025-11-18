import { Survey, SurveyDefinition, SurveyStatus } from '../models/survey';
import { getDatabase, nextId, persistDatabase } from '../storage/database';

export interface CreateSurveyPayload {
  title: string;
  description?: string;
  status: SurveyStatus;
  definition: SurveyDefinition;
}

export async function createSurvey(shopId: number, payload: CreateSurveyPayload): Promise<Survey> {
  const db = getDatabase();
  const survey: Survey = {
    id: nextId(db.surveys),
    shop_id: shopId,
    title: payload.title,
    description: payload.description ?? null,
    status: payload.status,
    definition: payload.definition,
    created_at: new Date().toISOString(),
  };
  db.surveys.push(survey);
  persistDatabase();
  return survey;
}

export async function listSurveysForShop(shopId: number): Promise<Survey[]> {
  const db = getDatabase();
  return db.surveys.filter((survey) => survey.shop_id === shopId);
}

export async function getSurveyById(id: number): Promise<Survey | null> {
  const db = getDatabase();
  return db.surveys.find((survey) => survey.id === id) ?? null;
}

export async function getActiveSurveyForShop(shopId: number): Promise<Survey | null> {
  const db = getDatabase();
  const active = db.surveys
    .filter((survey) => survey.shop_id === shopId && survey.status === 'active')
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  return active[0] ?? null;
}

export async function createSurveyResponse(
  surveyId: number,
  sessionId: string,
  answers: Record<string, unknown>,
  metadata: Record<string, unknown> | undefined,
): Promise<void> {
  const db = getDatabase();
  db.survey_responses.push({
    id: nextId(db.survey_responses),
    survey_id: surveyId,
    session_id: sessionId,
    answers,
    metadata: metadata ?? null,
    created_at: new Date().toISOString(),
  });
  persistDatabase();
}
