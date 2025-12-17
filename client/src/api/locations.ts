import { request } from './request';

export interface Location {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

const API_BASE = '/api';
const LOCATIONS_URL = `${API_BASE}/locations`;

export function fetchLocations() {
  return request<Location[]>(LOCATIONS_URL, { cache: 'no-cache' });
}

