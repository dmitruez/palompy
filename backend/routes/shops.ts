import { Router } from 'express';
import { z } from 'zod';
import { createShop } from '../services/shopsService';

const router = Router();

const createShopSchema = z.object({
  name: z.string().min(2, 'Name is required'),
});

router.post('/', async (req, res, next) => {
  try {
    const body = createShopSchema.parse(req.body);
    const shop = await createShop(body.name);
    res.status(201).json({ shop });
  } catch (error) {
    next(error);
  }
});

export default router;
