import { Router } from 'express';
import { z } from 'zod';
import { getShopById, getShopByPublicKey } from '../services/shopsService';
import { getAnalyticsSummary, recordWidgetEvent } from '../services/analyticsService';

const router = Router();

const eventSchema = z.object({
  shopPublicKey: z.string().uuid(),
  sessionId: z.string().min(4),
  eventName: z.string().min(2),
  metadata: z.record(z.any()).optional(),
});

router.post('/events', async (req, res, next) => {
  try {
    const payload = eventSchema.parse(req.body);
    const shop = await getShopByPublicKey(payload.shopPublicKey);
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    await recordWidgetEvent({
      shopId: shop.id,
      sessionId: payload.sessionId,
      eventName: payload.eventName,
      metadata: payload.metadata,
    });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

router.get('/shops/:shopId/summary', async (req, res, next) => {
  try {
    const numericId = Number(req.params.shopId);
    if (Number.isNaN(numericId)) {
      return res.status(400).json({ error: 'Invalid shop id' });
    }
    const shop = await getShopById(numericId);
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    const summary = await getAnalyticsSummary(shop.id);
    res.json({ summary });
  } catch (error) {
    next(error);
  }
});

export default router;
