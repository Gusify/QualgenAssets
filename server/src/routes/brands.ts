import express from 'express';
import Brand from '../models/Brand';

const router = express.Router();

router.get('/', async (_req, res, next) => {
  try {
    const brands = await Brand.findAll({ order: [['name', 'ASC']] });
    res.json(brands);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name } = req.body as Record<string, unknown>;
    const trimmedName = typeof name === 'string' ? name.trim() : '';

    if (!trimmedName) {
      return res.status(400).json({ message: 'name is required' });
    }

    const [brand] = await Brand.findOrCreate({
      where: { name: trimmedName },
      defaults: { name: trimmedName }
    });

    res.status(201).json(brand);
  } catch (error) {
    next(error);
  }
});

export default router;
