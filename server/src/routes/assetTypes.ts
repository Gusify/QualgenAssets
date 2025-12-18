import express from 'express';
import AssetType from '../models/AssetType';

const router = express.Router();

router.get('/', async (_req, res, next) => {
  try {
    const assetTypes = await AssetType.findAll({ order: [['name', 'ASC']] });
    res.json(assetTypes);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, description } = req.body as Record<string, unknown>;
    const trimmedName = typeof name === 'string' ? name.trim() : '';

    if (!trimmedName) {
      return res.status(400).json({ message: 'name is required' });
    }

    const [assetType] = await AssetType.findOrCreate({
      where: { name: trimmedName },
      defaults: { name: trimmedName, description: typeof description === 'string' ? description : null }
    });

    res.status(201).json(assetType);
  } catch (error) {
    next(error);
  }
});

export default router;
