import { request } from './request';

export interface Brand {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

const API_BASE = '/api';
const BRANDS_URL = `${API_BASE}/brands`;

export function fetchBrands() {
  return request<Brand[]>(BRANDS_URL, { cache: 'no-cache' });
}

export function createBrand(name: string) {
  return request<Brand>(BRANDS_URL, {
    method: 'POST',
    body: JSON.stringify({ name })
  });
}
