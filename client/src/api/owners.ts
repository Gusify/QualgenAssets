import { request } from './request';

export interface Owner {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

const API_BASE = '/api';
const OWNERS_URL = `${API_BASE}/owners`;

export function fetchOwners() {
  return request<Owner[]>(OWNERS_URL, { cache: 'no-cache' });
}

