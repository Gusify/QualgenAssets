export interface Asset {
  id: number;
  number: string;
  name: string;
  location: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssetPayload {
  number: string;
  name: string;
  location: string;
  owner: string;
}

const API_BASE = '/api';
const ASSETS_URL = `${API_BASE}/assets`;

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    headers: { 'Content-Type': 'application/json' },
    ...init
  });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `Request failed (${res.status})`);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

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
