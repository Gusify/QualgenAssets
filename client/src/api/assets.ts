import { request } from './request';

export interface Asset {
  id: number;
  number: string;
  name: string;
  locationId: number;
  ownerId: number;
  location: string | null;
  owner: string | null;
  expressServiceTag: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssetPayload {
  number: string;
  name: string;
  ownerId?: number;
  owner?: string;
  locationId?: number;
  location?: string;
  expressServiceTag?: string | null;
}

const API_BASE = '/api';
const ASSETS_URL = `${API_BASE}/assets`;

export function fetchAssets() {
  return request<Asset[]>(ASSETS_URL, { cache: 'no-cache' });
}

export function createAsset(payload: AssetPayload) {
  return request<Asset>(ASSETS_URL, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function updateAsset(id: number, payload: AssetPayload) {
  return request<Asset>(`${ASSETS_URL}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export function deleteAsset(id: number) {
  return request<void>(`${ASSETS_URL}/${id}`, {
    method: 'DELETE'
  });
}
