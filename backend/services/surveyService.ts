import { pool } from '../config/db';
import { Survey, SurveyDefinition, SurveyStatus } from '../models/survey';

interface SurveyRow {
  id: number;
  shop_id: number;
  title: string;
  description: string | null;
  status: SurveyStatus;
  definition: SurveyDefinition;
  created_at: string;
}

export interface CreateSurveyPayload {
  title: string;
  description?: string;
  status: SurveyStatus;
  definition: SurveyDefinition;
}

function mapSurveyRow(row: SurveyRow): Survey {
  return {
    ...row,
    definition: row.definition,
  };
}

export async function createSurvey(shopId: number, payload: CreateSurveyPayload): Promise<Survey> {
  const { rows } = await pool.query<SurveyRow>(
    `INSERT INTO surveys (shop_id, title, description, status, definition)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, shop_id, title, description, status, definition, created_at`,
    [shopId, payload.title, payload.description ?? null, payload.status, payload.definition],
  );
  return mapSurveyRow(rows[0]);
}

export async function listSurveysForShop(shopId: number): Promise<Survey[]> {
  const { rows } = await pool.query<SurveyRow>(
    `SELECT id, shop_id, title, description, status, definition, created_at
     FROM surveys
     WHERE shop_id = $1
     ORDER BY created_at DESC`,
    [shopId],
  );
  return rows.map(mapSurveyRow);
}

export async function getSurveyById(id: number): Promise<Survey | null> {
  const { rows } = await pool.query<SurveyRow>(
    `SELECT id, shop_id, title, description, status, definition, created_at
     FROM surveys
     WHERE id = $1`,
    [id],
  );
  return rows[0] ? mapSurveyRow(rows[0]) : null;
}

export async function getActiveSurveyForShop(shopId: number): Promise<Survey | null> {
  const { rows } = await pool.query<SurveyRow>(
    `SELECT id, shop_id, title, description, status, definition, created_at
     FROM surveys
     WHERE shop_id = $1 AND status = 'active'
     ORDER BY created_at DESC
     LIMIT 1`,
    [shopId],
  );
  return rows[0] ? mapSurveyRow(rows[0]) : null;
}

export async function createSurveyResponse(
  surveyId: number,
  sessionId: string,
  answers: Record<string, unknown>,
  metadata: Record<string, unknown> | undefined,
): Promise<void> {
  await pool.query(
    `INSERT INTO survey_responses (survey_id, session_id, answers, metadata)
     VALUES ($1, $2, $3, $4)`,
    [surveyId, sessionId, answers, metadata ?? null],
  );
}
