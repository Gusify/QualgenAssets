import express from 'express';
import Owner from '../models/Owner';

const router = express.Router();

router.get('/', async (_req, res, next) => {
  try {
    const owners = await Owner.findAll({ order: [['name', 'ASC']] });
    res.json(owners);
  } catch (error) {
    next(error);
  }
});

export default router;

