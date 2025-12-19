import { request } from './request';
import type { AssetModel, AssetSpec } from './assets';

const API_BASE = '/api';
const ASSET_MODELS_URL = `${API_BASE}/asset-models`;

export interface AssetModelPayload {
  assetTypeId: number;
  brandId: number;
  title: string;
  specSummary?: string | null;
  specs?: AssetSpec[];
}

export function fetchAssetModels() {
  return request<AssetModel[]>(ASSET_MODELS_URL, { cache: 'no-cache' });
}

export function createAssetModel(payload: AssetModelPayload) {
  return request<AssetModel>(ASSET_MODELS_URL, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}
