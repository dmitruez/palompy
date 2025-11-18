import { RouteDefinition } from '../http/types';
import { json } from '../http/responses';
import { HttpError } from '../http/errors';
import { getShopById, getShopByPublicKey } from '../services/shopsService';
import {
  createSurvey,
  getActiveSurveyForShop,
  listSurveysForShop,
} from '../services/surveyService';
import {
  assertArray,
  assertBoolean,
  assertOneOf,
  assertRecord,
  assertString,
  assertUuid,
} from '../utils/validation';

const surveyStatuses = ['draft', 'active', 'archived'] as const;
const questionTypes = ['single-choice', 'multi-choice', 'text'] as const;

type SurveyStatus = (typeof surveyStatuses)[number];

type QuestionType = (typeof questionTypes)[number];

function parseQuestions(value: unknown): {
  id: string;
  prompt: string;
  type: QuestionType;
  required?: boolean;
  options?: { id: string; label: string }[];
}[] {
  const array = assertArray(value, 'questions');
  if (!array.length) {
    throw new HttpError(400, 'Нужно добавить минимум один вопрос');
  }
  return array.map((item, index) => {
    const record = assertRecord(item, `questions[${index}]`);
    const id = assertString(record.id, 'question.id', { minLength: 1 });
    const prompt = assertString(record.prompt, 'question.prompt', { minLength: 2 });
    const type = assertOneOf(record.type, 'question.type', questionTypes);
    const question: {
      id: string;
      prompt: string;
      type: QuestionType;
      required?: boolean;
      options?: { id: string; label: string }[];
    } = { id, prompt, type };
    if (record.required !== undefined) {
      question.required = assertBoolean(record.required, 'question.required');
    }
    if (record.options !== undefined) {
      const options = assertArray(record.options, 'question.options').map((option, optionIndex) => {
        const optionRecord = assertRecord(option, `question.options[${optionIndex}]`);
        return {
          id: assertString(optionRecord.id, 'option.id', { minLength: 1 }),
          label: assertString(optionRecord.label, 'option.label', { minLength: 1 }),
        };
      });
      question.options = options;
    }
    return question;
  });
}

const routes: RouteDefinition[] = [
  {
    method: 'POST',
    path: '/api/shops/:shopId/surveys',
    handler: async ({ request }) => {
      const shopId = Number(request.params.shopId);
      if (!Number.isFinite(shopId)) {
        throw new HttpError(400, 'Некорректный идентификатор магазина');
      }
      const shop = await getShopById(shopId);
      if (!shop) {
        throw new HttpError(404, 'Магазин не найден');
      }
      const body = assertRecord(request.body, 'body');
      const title = assertString(body.title, 'title', { minLength: 2 });
      const description = body.description ? assertString(body.description, 'description') : undefined;
      const status = body.status ? assertOneOf<SurveyStatus>(body.status, 'status', surveyStatuses as unknown as SurveyStatus[]) : 'draft';
      const questions = parseQuestions(body.questions);
      const survey = await createSurvey(shop.id, {
        title,
        description,
        status,
        definition: { questions },
      });
      return json({ survey }, 201);
    },
  },
  {
    method: 'GET',
    path: '/api/shops/:shopId/surveys',
    handler: async ({ request }) => {
      const shopId = Number(request.params.shopId);
      if (!Number.isFinite(shopId)) {
        throw new HttpError(400, 'Некорректный идентификатор магазина');
      }
      const shop = await getShopById(shopId);
      if (!shop) {
        throw new HttpError(404, 'Магазин не найден');
      }
      const surveys = await listSurveysForShop(shop.id);
      return json({ surveys });
    },
  },
  {
    method: 'GET',
    path: '/api/shops/:shopId/surveys/active',
    handler: async ({ request }) => {
      const shopId = Number(request.params.shopId);
      if (!Number.isFinite(shopId)) {
        throw new HttpError(400, 'Некорректный идентификатор магазина');
      }
      const shop = await getShopById(shopId);
      if (!shop) {
        throw new HttpError(404, 'Магазин не найден');
      }
      const survey = await getActiveSurveyForShop(shop.id);
      return json({ survey });
    },
  },
  {
    method: 'GET',
    path: '/api/shops/public/:publicKey/surveys/active',
    handler: async ({ request }) => {
      const publicKey = assertUuid(request.params.publicKey, 'publicKey');
      const shop = await getShopByPublicKey(publicKey);
      if (!shop) {
        throw new HttpError(404, 'Магазин не найден');
      }
      const survey = await getActiveSurveyForShop(shop.id);
      return json({ survey });
    },
  },
];

export default routes;
