import express from 'express';
import Asset from '../models/Asset';

const router = express.Router();

router.get('/', async (_req, res, next) => {
  try {
    const assets = await Asset.findAll({ order: [['updatedAt', 'DESC']] });
    console.log('Assets fetched from DB:', assets);
    res.json(assets);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const asset = await Asset.findByPk(req.params.id);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }
    res.json(asset);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { number, name, location, owner } = req.body;
    if (!number || !name || !location || !owner) {
      return res.status(400).json({ message: 'number, name, location, and owner are required' });
    }
    const asset = await Asset.create({ number, name, location, owner });
    res.status(201).json(asset);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { number, name, location, owner } = req.body;
    const asset = await Asset.findByPk(req.params.id);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }
    await asset.update({ number, name, location, owner });
    res.json(asset);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const asset = await Asset.findByPk(req.params.id);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }
    await asset.destroy();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
