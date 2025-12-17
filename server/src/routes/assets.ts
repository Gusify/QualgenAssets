import express from 'express';
import Asset from '../models/Asset';
import Location from '../models/Location';

const router = express.Router();

function serializeAsset(asset: Asset) {
  const raw = asset.get({ plain: true }) as unknown as Record<string, unknown> & {
    location?: { name?: string } | null;
  };

  return {
    ...raw,
    location: raw.location?.name ?? null
  };
}

router.get('/', async (_req, res, next) => {
  try {
    const assets = await Asset.findAll({
      include: [{ model: Location, as: 'location' }],
      order: [['updatedAt', 'DESC']]
    });
    res.json(assets.map(serializeAsset));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const asset = await Asset.findByPk(req.params.id, {
      include: [{ model: Location, as: 'location' }]
    });
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }
    res.json(serializeAsset(asset));
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { number, name, location, owner, locationId, expressServiceTag } = req.body as Record<
      string,
      unknown
    >;

    const normalizedExpressServiceTag =
      typeof expressServiceTag === 'string' && expressServiceTag.trim().length
        ? expressServiceTag.trim()
        : null;

    const locationName =
      typeof location === 'string' && location.trim().length ? location.trim() : null;
    const parsedLocationId =
      typeof locationId === 'number'
        ? locationId
        : typeof locationId === 'string' && locationId.trim().length
          ? Number(locationId)
          : null;

    if (
      typeof number !== 'string' ||
      typeof name !== 'string' ||
      typeof owner !== 'string' ||
      (!locationName && !parsedLocationId)
    ) {
      return res.status(400).json({
        message: 'number, name, owner, and (location or locationId) are required'
      });
    }

    const resolvedLocationId =
      parsedLocationId ??
      (
        await Location.findOrCreate({
          where: { name: locationName! },
          defaults: { name: locationName! }
        })
      )[0].id;

    const asset = await Asset.create({
      number,
      name,
      locationId: resolvedLocationId,
      owner,
      expressServiceTag: normalizedExpressServiceTag
    });
    const created = await Asset.findByPk(asset.id, { include: [{ model: Location, as: 'location' }] });

    res.status(201).json(created ? serializeAsset(created) : serializeAsset(asset));
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { number, name, location, owner, locationId, expressServiceTag } = req.body as Record<
      string,
      unknown
    >;
    const asset = await Asset.findByPk(req.params.id, { include: [{ model: Location, as: 'location' }] });
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    const payload: Partial<{
      number: string;
      name: string;
      owner: string;
      locationId: number;
      expressServiceTag: string | null;
    }> = {};

    if (typeof number === 'string' && number.trim().length) payload.number = number.trim();
    if (typeof name === 'string' && name.trim().length) payload.name = name.trim();
    if (typeof owner === 'string' && owner.trim().length) payload.owner = owner.trim();

    if (typeof expressServiceTag === 'string') {
      payload.expressServiceTag = expressServiceTag.trim().length ? expressServiceTag.trim() : null;
    } else if (expressServiceTag === null) {
      payload.expressServiceTag = null;
    }

    const locationName =
      typeof location === 'string' && location.trim().length ? location.trim() : null;
    const parsedLocationId =
      typeof locationId === 'number'
        ? locationId
        : typeof locationId === 'string' && locationId.trim().length
          ? Number(locationId)
          : null;

    if (locationName) {
      const [resolved] = await Location.findOrCreate({
        where: { name: locationName },
        defaults: { name: locationName }
      });
      payload.locationId = resolved.id;
    } else if (parsedLocationId) {
      payload.locationId = parsedLocationId;
    }

    await asset.update(payload);

    const updated = await Asset.findByPk(asset.id, { include: [{ model: Location, as: 'location' }] });
    res.json(updated ? serializeAsset(updated) : serializeAsset(asset));
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
