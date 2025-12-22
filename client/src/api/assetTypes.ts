import { request } from './request';

export interface AssetType {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

const API_BASE = '/api';
const ASSET_TYPES_URL = `${API_BASE}/asset-types`;

export function fetchAssetTypes() {
  return request<AssetType[]>(ASSET_TYPES_URL, { cache: 'no-cache' });
}

export function createAssetType(name: string, description?: string | null) {
  return request<AssetType>(ASSET_TYPES_URL, {
    method: 'POST',
    body: JSON.stringify({ name, description: description ?? null })
  });
}
