import { Router } from 'express';
import { z } from 'zod';
import { getShopById, getShopByPublicKey } from '../services/shopsService';
import { createSurvey, getActiveSurveyForShop, listSurveysForShop } from '../services/surveyService';

const router = Router();

const questionSchema = z.object({
  id: z.string().min(1),
  prompt: z.string().min(2),
  type: z.enum(['single-choice', 'multi-choice', 'text']),
  required: z.boolean().optional(),
  options: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
      }),
    )
    .optional(),
});

const surveySchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'archived']).default('draft'),
  questions: z.array(questionSchema).min(1),
});

router.post('/:shopId/surveys', async (req, res, next) => {
  try {
    const numericId = Number(req.params.shopId);
    if (Number.isNaN(numericId)) {
      return res.status(400).json({ error: 'Invalid shop id' });
    }
    const shop = await getShopById(numericId);
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    const payload = surveySchema.parse(req.body);
    const survey = await createSurvey(shop.id, {
      title: payload.title,
      description: payload.description,
      status: payload.status,
      definition: { questions: payload.questions },
    });
    res.status(201).json({ survey });
  } catch (error) {
    next(error);
  }
});

router.get('/:shopId/surveys', async (req, res, next) => {
  try {
    const numericId = Number(req.params.shopId);
    if (Number.isNaN(numericId)) {
      return res.status(400).json({ error: 'Invalid shop id' });
    }
    const shop = await getShopById(numericId);
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    const surveys = await listSurveysForShop(shop.id);
    res.json({ surveys });
  } catch (error) {
    next(error);
  }
});

router.get('/:shopId/surveys/active', async (req, res, next) => {
  try {
    const numericId = Number(req.params.shopId);
    if (Number.isNaN(numericId)) {
      return res.status(400).json({ error: 'Invalid shop id' });
    }
    const shop = await getShopById(numericId);
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    const survey = await getActiveSurveyForShop(shop.id);
    res.json({ survey });
  } catch (error) {
    next(error);
  }
});

router.get('/public/:publicKey/surveys/active', async (req, res, next) => {
  try {
    const shop = await getShopByPublicKey(req.params.publicKey);
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    const survey = await getActiveSurveyForShop(shop.id);
    res.json({ survey });
  } catch (error) {
    next(error);
  }
});

export default router;
