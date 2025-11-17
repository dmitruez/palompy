import { Router } from 'express';
import { z } from 'zod';
import { handleChatMessage } from '../services/chatService';
import { getShopByPublicKey } from '../services/shopsService';

const router = Router();

const chatSchema = z.object({
  shopPublicKey: z.string().uuid(),
  sessionId: z.string().min(8),
  message: z.string().min(2),
  language: z.enum(['ru', 'en']).optional(),
});

router.post('/', async (req, res, next) => {
  try {
    const body = chatSchema.parse(req.body);
    const shop = await getShopByPublicKey(body.shopPublicKey);
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    const answer = await handleChatMessage({
      shopId: shop.id,
      message: body.message,
      sessionId: body.sessionId,
      language: body.language,
    });
    res.json({ answer });
  } catch (error) {
    next(error);
  }
});

export default router;
