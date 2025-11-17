import { Router } from 'express';
import { z } from 'zod';
import { ingestKnowledgeDocuments } from '../services/knowledgeService';
import { getShopById } from '../services/shopsService';

const router = Router();

const documentSchema = z.object({
  sourceType: z.string(),
  sourceId: z.string().optional(),
  text: z.string().min(10, 'Document text is too short'),
  chunkSize: z.number().min(100).max(2000).optional(),
});

const uploadSchema = z.object({
  documents: z.array(documentSchema).min(1),
});

router.post('/:shopId/data', async (req, res, next) => {
  try {
    const { shopId } = req.params;
    const numericId = Number(shopId);
    if (Number.isNaN(numericId)) {
      return res.status(400).json({ error: 'Invalid shop id' });
    }
    const shop = await getShopById(numericId);
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    const body = uploadSchema.parse(req.body);
    const inserted = await ingestKnowledgeDocuments(shop.id, body.documents);
    res.json({ inserted });
  } catch (error) {
    next(error);
  }
});

export default router;
