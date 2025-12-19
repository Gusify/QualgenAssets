import express from 'express';
import Asset from '../models/Asset';
import AssetModel from '../models/AssetModel';
import AssetSpec from '../models/AssetSpec';
import AssetType from '../models/AssetType';
import Brand from '../models/Brand';
import Location from '../models/Location';
import Owner from '../models/Owner';

const router = express.Router();

const assetModelInclude = [
  {
    model: AssetModel,
    as: 'model',
    include: [
      { model: AssetType, as: 'assetType' },
      { model: Brand, as: 'brand' },
      { model: AssetSpec, as: 'specs' }
    ]
  }
];

function serializeAsset(asset: Asset) {
  const raw = asset.get({ plain: true }) as unknown as Record<string, unknown> & {
    location?: { name?: string } | null;
    owner?: { name?: string } | null;
    model?:
      | (Record<string, unknown> & {
          assetType?: { name?: string } | null;
          brand?: { name?: string } | null;
          specs?: Array<Record<string, unknown>>;
        })
      | null;
  };

  const model = raw.model ?? null;

  return {
    id: raw.id,
    number: raw.number,
    assetModelId: raw.assetModelId,
    locationId: raw.locationId,
    ownerId: raw.ownerId,
    expressServiceTag: raw.expressServiceTag ?? null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    location: raw.location?.name ?? null,
    owner: raw.owner?.name ?? null,
    model
  };
}

router.get('/', async (_req, res, next) => {
  try {
    const assets = await Asset.findAll({
      include: [
        { model: Location, as: 'location' },
        { model: Owner, as: 'owner' },
        ...assetModelInclude
      ],
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
      include: [
        { model: Location, as: 'location' },
        { model: Owner, as: 'owner' },
        ...assetModelInclude
      ]
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
    const { location, owner, locationId, ownerId, expressServiceTag, assetModelId } = req.body as Record<
      string,
      unknown
    >;

    const parsedAssetModelId =
      typeof assetModelId === 'number'
        ? assetModelId
        : typeof assetModelId === 'string' && assetModelId.trim().length
          ? Number(assetModelId)
          : null;

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

    const ownerName = typeof owner === 'string' && owner.trim().length ? owner.trim() : null;
    const parsedOwnerId =
      typeof ownerId === 'number'
        ? ownerId
        : typeof ownerId === 'string' && ownerId.trim().length
          ? Number(ownerId)
          : null;

    if (!parsedAssetModelId) {
      return res.status(400).json({
        message: 'assetModelId is required'
      });
    }

    if (!normalizedExpressServiceTag) {
      return res.status(400).json({
        message: 'expressServiceTag is required'
      });
    }

    if (!ownerName && !parsedOwnerId) {
      return res.status(400).json({
        message: 'owner or ownerId is required'
      });
    }

    if (!locationName && !parsedLocationId) {
      return res.status(400).json({
        message: 'location or locationId is required'
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

    const resolvedOwnerId =
      parsedOwnerId ??
      (
        await Owner.findOrCreate({
          where: { name: ownerName! },
          defaults: { name: ownerName! }
        })
      )[0].id;

    const model = await AssetModel.findByPk(parsedAssetModelId);
    if (!model) {
      return res.status(400).json({ message: 'assetModelId not found' });
    }

    const asset = await Asset.create({
      assetModelId: parsedAssetModelId,
      locationId: resolvedLocationId,
      ownerId: resolvedOwnerId,
      expressServiceTag: normalizedExpressServiceTag
    });
    const created = await Asset.findByPk(asset.id, {
      include: [
        { model: Location, as: 'location' },
        { model: Owner, as: 'owner' },
        ...assetModelInclude
      ]
    });

    res.status(201).json(created ? serializeAsset(created) : serializeAsset(asset));
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { location, owner, locationId, ownerId, expressServiceTag, assetModelId } = req.body as Record<
      string,
      unknown
    >;
    const asset = await Asset.findByPk(req.params.id, {
      include: [
        { model: Location, as: 'location' },
        { model: Owner, as: 'owner' },
        ...assetModelInclude
      ]
    });
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    const payload: Partial<{
      assetModelId: number;
      locationId: number;
      ownerId: number;
      expressServiceTag: string | null;
    }> = {};

    const parsedAssetModelId =
      typeof assetModelId === 'number'
        ? assetModelId
        : typeof assetModelId === 'string' && assetModelId.trim().length
          ? Number(assetModelId)
          : null;

    if (parsedAssetModelId) {
      const model = await AssetModel.findByPk(parsedAssetModelId);
      if (!model) {
        return res.status(400).json({ message: 'assetModelId not found' });
      }
      payload.assetModelId = parsedAssetModelId;
    }

    if (typeof expressServiceTag === 'string') {
      payload.expressServiceTag = expressServiceTag.trim().length ? expressServiceTag.trim() : null;
    } else if (expressServiceTag === null) {
      payload.expressServiceTag = null;
    }

    const ownerName = typeof owner === 'string' && owner.trim().length ? owner.trim() : null;
    const parsedOwnerId =
      typeof ownerId === 'number'
        ? ownerId
        : typeof ownerId === 'string' && ownerId.trim().length
          ? Number(ownerId)
          : null;

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

    if (ownerName) {
      const [resolved] = await Owner.findOrCreate({
        where: { name: ownerName },
        defaults: { name: ownerName }
      });
      payload.ownerId = resolved.id;
    } else if (parsedOwnerId) {
      payload.ownerId = parsedOwnerId;
    }

    await asset.update(payload);

    const updated = await Asset.findByPk(asset.id, {
      include: [
        { model: Location, as: 'location' },
        { model: Owner, as: 'owner' },
        ...assetModelInclude
      ]
    });
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
