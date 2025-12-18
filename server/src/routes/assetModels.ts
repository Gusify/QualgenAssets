import express from 'express';
import AssetModel from '../models/AssetModel';
import AssetSpec from '../models/AssetSpec';
import AssetType from '../models/AssetType';
import Brand from '../models/Brand';

const router = express.Router();

const includeConfig = [
  { model: AssetType, as: 'assetType' },
  { model: Brand, as: 'brand' },
  { model: AssetSpec, as: 'specs' }
];

router.get('/', async (_req, res, next) => {
  try {
    const models = await AssetModel.findAll({
      include: includeConfig,
      order: [['updatedAt', 'DESC']]
    });
    res.json(models);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { assetTypeId, brandId, title, specSummary, specs } = req.body as Record<
      string,
      unknown
    >;

    const parsedAssetTypeId =
      typeof assetTypeId === 'number'
        ? assetTypeId
        : typeof assetTypeId === 'string' && assetTypeId.trim().length
          ? Number(assetTypeId)
          : null;
    const parsedBrandId =
      typeof brandId === 'number'
        ? brandId
        : typeof brandId === 'string' && brandId.trim().length
          ? Number(brandId)
          : null;
    const titleValue = typeof title === 'string' ? title.trim() : '';
    const specSummaryValue = typeof specSummary === 'string' ? specSummary : null;

    if (!parsedAssetTypeId || !parsedBrandId || !titleValue) {
      return res
        .status(400)
        .json({ message: 'assetTypeId, brandId, and title are required to create an asset model' });
    }

    const type = await AssetType.findByPk(parsedAssetTypeId);
    if (!type) return res.status(400).json({ message: 'assetTypeId not found' });

    const brand = await Brand.findByPk(parsedBrandId);
    if (!brand) return res.status(400).json({ message: 'brandId not found' });

    const model = await AssetModel.create({
      assetTypeId: parsedAssetTypeId,
      brandId: parsedBrandId,
      title: titleValue,
      specSummary: specSummaryValue
    });

    const specsPayload = Array.isArray(specs)
      ? specs
          .map(item => {
            const key = typeof (item as { key?: unknown }).key === 'string' ? (item as { key: string }).key.trim() : '';
            const value =
              typeof (item as { value?: unknown }).value === 'string'
                ? (item as { value: string }).value.trim()
                : '';
            return { key, value };
          })
          .filter(entry => entry.key && entry.value)
      : [];

    if (specsPayload.length) {
      await AssetSpec.bulkCreate(
        specsPayload.map(entry => ({
          assetModelId: model.id,
          key: entry.key,
          value: entry.value
        }))
      );
    }

    const created = await AssetModel.findByPk(model.id, { include: includeConfig });
    res.status(201).json(created ?? model);
  } catch (error) {
    next(error);
  }
});

export default router;
