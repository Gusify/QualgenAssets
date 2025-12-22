import express from 'express';
import Location from '../models/Location';

const router = express.Router();

router.get('/', async (_req, res, next) => {
  try {
    const locations = await Location.findAll({ order: [['name', 'ASC'], ['room', 'ASC']] });
    res.json(locations);
  } catch (error) {
    next(error);
  }
});

export default router;
