import { Router } from 'express';
import { z } from 'zod';
import { createSurveyResponse, getSurveyById } from '../services/surveyService';

const router = Router();

const answersSchema = z.record(z.string(), z.union([z.string(), z.array(z.string())]));

const responseSchema = z.object({
  sessionId: z.string().min(8),
  answers: answersSchema.refine((value) => Object.keys(value).length > 0, {
    message: 'At least one answer is required',
  }),
  metadata: z.record(z.any()).optional(),
});

router.post('/:surveyId/responses', async (req, res, next) => {
  try {
    const surveyId = Number(req.params.surveyId);
    if (Number.isNaN(surveyId)) {
      return res.status(400).json({ error: 'Invalid survey id' });
    }
    const survey = await getSurveyById(surveyId);
    if (!survey || survey.status === 'archived') {
      return res.status(404).json({ error: 'Survey not found' });
    }
    const payload = responseSchema.parse(req.body);
    await createSurveyResponse(survey.id, payload.sessionId, payload.answers, payload.metadata);
    res.status(201).json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;
