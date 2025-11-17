export type SurveyStatus = 'draft' | 'active' | 'archived';

export interface SurveyQuestionOption {
  id: string;
  label: string;
}

export interface SurveyQuestionDefinition {
  id: string;
  prompt: string;
  type: 'single-choice' | 'multi-choice' | 'text';
  required?: boolean;
  options?: SurveyQuestionOption[];
}

export interface SurveyDefinition {
  questions: SurveyQuestionDefinition[];
}

export interface Survey {
  id: number;
  shop_id: number;
  title: string;
  description: string | null;
  status: SurveyStatus;
  definition: SurveyDefinition;
  created_at: string;
}

export interface SurveyResponse {
  id: number;
  survey_id: number;
  session_id: string;
  answers: Record<string, unknown>;
  metadata: Record<string, unknown> | null;
  created_at: string;
}
