import { request } from './request';
import type { Location } from './locations';

export type PurchaseType = 'purchase' | 'leased';

export interface Asset {
  id: number;
  assetModelId: number;
  locationId: number;
  ownerId: number;
  model: AssetModel | null;
  location: Location | string | null;
  owner: string | null;
  maintenanceRecords?: Maintenance[];
  expressServiceTag: string | null;
  purchaseType: PurchaseType | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssetNote {
  id?: number;
  key: string;
  value: string;
}

export interface Maintenance {
  id: number;
  assetId: number;
  vendor: string;
  duration: string;
  scheduledAt: string;
  completedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AssetModel {
  id: number;
  assetTypeId: number;
  brandId: number;
  title: string;
  specSummary: string | null;
  assetType?: { id: number; name: string } | null;
  brand?: { id: number; name: string } | null;
  notes?: AssetNote[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AssetPayload {
  assetModelId?: number;
  ownerId?: number;
  owner?: string;
  locationId?: number;
  location?: string;
  locationRoom?: string;
  purchaseType?: PurchaseType | null;
  maintenance?: {
    vendor?: string;
    duration?: string;
    scheduledAt?: string;
  };
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

export function completeMaintenance(assetId: number, maintenanceId: number) {
  return request<Asset>(`${ASSETS_URL}/${assetId}/maintenance/${maintenanceId}/complete`, {
    method: 'POST'
  });
}
