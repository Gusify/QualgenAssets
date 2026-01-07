import express from 'express';
import type { Includeable, Order } from 'sequelize';
import { sequelize } from '../db';
import Asset, { PurchaseType } from '../models/Asset';
import AssetMaintenance from '../models/AssetMaintenance';
import AssetModel from '../models/AssetModel';
import AssetNote from '../models/AssetNote';
import AssetType from '../models/AssetType';
import Brand from '../models/Brand';
import Location from '../models/Location';
import Owner from '../models/Owner';

const router = express.Router();

const maintenanceOrder: Order = [
  ['completedAt', 'ASC'],
  ['scheduledAt', 'DESC'],
  ['createdAt', 'DESC']
];

const maintenanceInclude: Includeable = {
  model: AssetMaintenance,
  as: 'maintenanceRecords',
  separate: true,
  order: maintenanceOrder
};

const assetIncludes = [
  { model: Location, as: 'location' },
  { model: Owner, as: 'owner' },
  { model: AssetNote, as: 'notes' },
  {
    model: AssetModel,
    as: 'model',
    include: [
      { model: AssetType, as: 'assetType' },
      { model: Brand, as: 'brand' }
    ]
  },
  maintenanceInclude
];

function normalizePurchaseType(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === 'purchase' || normalized === 'leased') {
    return normalized as PurchaseType;
  }
  return null;
}

function serializeAsset(asset: Asset) {
  const raw = asset.get({ plain: true }) as unknown as Record<string, unknown> & {
    location?: { name?: string; room?: string | null } | null;
    owner?: { name?: string } | null;
    purchaseType?: PurchaseType | null;
    notes?: Array<Record<string, unknown>>;
    model?:
      | (Record<string, unknown> & {
          assetType?: { name?: string } | null;
          brand?: { name?: string } | null;
          specs?: Array<Record<string, unknown>>;
        })
      | null;
    maintenanceRecords?: Array<Record<string, unknown> & { completedAt?: Date | null }>;
  };

  const model = raw.model ?? null;
  const maintenanceRecords =
    raw.maintenanceRecords?.map(record => ({
      ...record,
      completedAt: record.completedAt ?? null
    })) ?? [];

  return {
    id: raw.id,
    assetModelId: raw.assetModelId,
    locationId: raw.locationId,
    ownerId: raw.ownerId,
    expressServiceTag: raw.expressServiceTag ?? null,
    purchaseType: raw.purchaseType ?? null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    location: raw.location
      ? { name: raw.location.name ?? null, room: raw.location.room ?? null }
      : null,
    owner: raw.owner?.name ?? null,
    notes: raw.notes ?? [],
    model,
    maintenanceRecords
  };
}

function parseNotesPayload(body: Record<string, unknown>) {
  const explicitNotes = Array.isArray(body.notes)
    ? (body.notes as unknown[])
        .map(item => {
          const key =
            typeof (item as { key?: unknown }).key === 'string'
              ? (item as { key: string }).key.trim()
              : '';
          const value =
            typeof (item as { value?: unknown }).value === 'string'
              ? (item as { value: string }).value.trim()
              : '';
          return { key, value };
        })
        .filter(entry => entry.key && entry.value)
    : [];

  const noteSummary =
    typeof (body as { noteSummary?: unknown }).noteSummary === 'string'
      ? (body as { noteSummary: string }).noteSummary.trim()
      : '';
  const legacySpecSummary =
    typeof (body as { specSummary?: unknown }).specSummary === 'string'
      ? (body as { specSummary: string }).specSummary.trim()
      : '';

  const notesPayload = [...explicitNotes];
  if (noteSummary && !notesPayload.length) {
    notesPayload.push({ key: 'Notes', value: noteSummary });
  } else if (legacySpecSummary && !notesPayload.length) {
    notesPayload.push({ key: 'Notes', value: legacySpecSummary });
  }

  const hasNotesInput =
    Object.prototype.hasOwnProperty.call(body, 'notes') ||
    typeof (body as { noteSummary?: unknown }).noteSummary === 'string' ||
    typeof (body as { specSummary?: unknown }).specSummary === 'string';

  return { hasNotesInput, notesPayload };
}

router.get('/', async (_req, res, next) => {
  try {
    const assets = await Asset.findAll({
      include: assetIncludes,
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
      include: assetIncludes
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
    const {
      location,
      locationRoom,
      owner,
      locationId,
      ownerId,
      expressServiceTag,
      assetModelId,
      purchaseType,
      maintenance
    } = req.body as Record<string, unknown>;
    const { notesPayload } = parseNotesPayload(req.body as Record<string, unknown>);

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

    let normalizedPurchaseType: PurchaseType | null = null;
    if (purchaseType !== undefined && purchaseType !== null) {
      if (typeof purchaseType !== 'string') {
        return res.status(400).json({ message: 'purchaseType must be leased or purchase' });
      }
      normalizedPurchaseType = normalizePurchaseType(purchaseType);
      if (purchaseType.trim().length && !normalizedPurchaseType) {
        return res.status(400).json({ message: 'purchaseType must be leased or purchase' });
      }
    }

    const locationName =
      typeof location === 'string' && location.trim().length ? location.trim() : null;
    const locationRoomValue =
      typeof locationRoom === 'string' && locationRoom.trim().length ? locationRoom.trim() : null;
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
          where: { name: locationName!, room: locationRoomValue ?? null },
          defaults: { name: locationName!, room: locationRoomValue ?? null }
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
      expressServiceTag: normalizedExpressServiceTag,
      purchaseType: normalizedPurchaseType
    });

    if (notesPayload.length) {
      await AssetNote.bulkCreate(
        notesPayload.map(entry => ({
          assetId: asset.id,
          key: entry.key,
          value: entry.value
        }))
      );
    }

    if (maintenance && typeof maintenance === 'object') {
      const maintenanceVendor =
        typeof (maintenance as { vendor?: unknown }).vendor === 'string'
          ? (maintenance as { vendor: string }).vendor.trim()
          : '';
      const maintenanceDuration =
        typeof (maintenance as { duration?: unknown }).duration === 'string'
          ? (maintenance as { duration: string }).duration.trim()
          : '';
      const maintenanceScheduled =
        typeof (maintenance as { scheduledAt?: unknown }).scheduledAt === 'string'
          ? (maintenance as { scheduledAt: string }).scheduledAt
          : null;

      if (maintenanceVendor && maintenanceDuration && maintenanceScheduled) {
        await AssetMaintenance.create({
          assetId: asset.id,
          vendor: maintenanceVendor,
          duration: maintenanceDuration,
          scheduledAt: new Date(maintenanceScheduled)
        });
      }
    }

    const created = await Asset.findByPk(asset.id, {
      include: assetIncludes
    });

    res.status(201).json(created ? serializeAsset(created) : serializeAsset(asset));
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const {
      location,
      locationRoom,
      owner,
      locationId,
      ownerId,
      expressServiceTag,
      assetModelId,
      maintenance,
      purchaseType
    } = req.body as Record<string, unknown>;
    const { hasNotesInput, notesPayload } = parseNotesPayload(req.body as Record<string, unknown>);
    const asset = await Asset.findByPk(req.params.id, {
      include: assetIncludes
    });
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    const payload: Partial<{
      assetModelId: number;
      locationId: number;
      ownerId: number;
      expressServiceTag: string | null;
      purchaseType: PurchaseType | null;
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

    if (purchaseType !== undefined) {
      if (purchaseType === null) {
        payload.purchaseType = null;
      } else if (typeof purchaseType === 'string') {
        const normalized = normalizePurchaseType(purchaseType);
        if (purchaseType.trim().length && !normalized) {
          return res.status(400).json({ message: 'purchaseType must be leased or purchase' });
        }
        payload.purchaseType = normalized;
      } else {
        return res.status(400).json({ message: 'purchaseType must be leased or purchase' });
      }
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
    const locationRoomValue =
      typeof locationRoom === 'string' && locationRoom.trim().length ? locationRoom.trim() : null;
    const parsedLocationId =
      typeof locationId === 'number'
        ? locationId
        : typeof locationId === 'string' && locationId.trim().length
          ? Number(locationId)
          : null;

    if (locationName) {
      const [resolved] = await Location.findOrCreate({
        where: { name: locationName, room: locationRoomValue ?? null },
        defaults: { name: locationName, room: locationRoomValue ?? null }
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

    if (hasNotesInput) {
      await sequelize.transaction(async transaction => {
        await AssetNote.destroy({ where: { assetId: asset.id }, transaction });
        if (notesPayload.length) {
          await AssetNote.bulkCreate(
            notesPayload.map(entry => ({
              assetId: asset.id,
              key: entry.key,
              value: entry.value
            })),
            { transaction }
          );
        }
      });
    }

    if (maintenance && typeof maintenance === 'object') {
      const maintenanceVendor =
        typeof (maintenance as { vendor?: unknown }).vendor === 'string'
          ? (maintenance as { vendor: string }).vendor.trim()
          : '';
      const maintenanceDuration =
        typeof (maintenance as { duration?: unknown }).duration === 'string'
          ? (maintenance as { duration: string }).duration.trim()
          : '';
      const maintenanceScheduled =
        typeof (maintenance as { scheduledAt?: unknown }).scheduledAt === 'string'
          ? (maintenance as { scheduledAt: string }).scheduledAt
          : null;

      if (maintenanceVendor && maintenanceDuration && maintenanceScheduled) {
        await AssetMaintenance.create({
          assetId: asset.id,
          vendor: maintenanceVendor,
          duration: maintenanceDuration,
          scheduledAt: new Date(maintenanceScheduled)
        });
      }
    }

    const updated = await Asset.findByPk(asset.id, {
      include: assetIncludes
    });
    res.json(updated ? serializeAsset(updated) : serializeAsset(asset));
  } catch (error) {
    next(error);
  }
});

router.post('/:assetId/maintenance/:maintenanceId/complete', async (req, res, next) => {
  try {
    const assetId = Number(req.params.assetId);
    const maintenanceId = Number(req.params.maintenanceId);

    if (!Number.isInteger(assetId) || !Number.isInteger(maintenanceId)) {
      return res.status(400).json({ message: 'Invalid assetId or maintenanceId' });
    }

    const maintenance = await AssetMaintenance.findOne({
      where: { id: maintenanceId, assetId }
    });

    if (!maintenance) {
      return res.status(404).json({ message: 'Maintenance record not found' });
    }

    if (!maintenance.completedAt) {
      await maintenance.update({ completedAt: new Date() });
    }

    const asset = await Asset.findByPk(assetId, { include: assetIncludes });
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    res.json(serializeAsset(asset));
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
