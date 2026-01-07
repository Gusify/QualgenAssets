<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import {
  Asset,
  AssetModel,
  AssetPayload,
  Maintenance,
  PurchaseType,
  completeMaintenance,
  createAsset,
  deleteAsset,
  fetchAssets,
  updateAsset
} from '../api/assets';
import { createAssetModel, fetchAssetModels } from '../api/assetModels';
import { createAssetType, fetchAssetTypes, AssetType } from '../api/assetTypes';
import { createBrand, fetchBrands, Brand } from '../api/brands';
import { fetchLocations, Location } from '../api/locations';
import { fetchOwners, Owner as OwnerOption } from '../api/owners';

const assets = ref<Asset[]>([]);
const loading = ref(false);
const completingMaintenanceId = ref<number | null>(null);
const editingAsset = ref<Asset | null>(null);
const editingMaintenance = ref<Maintenance | null>(null);
const assetModels = ref<AssetModel[]>([]);
const assetModelsLoading = ref(false);
const assetTypes = ref<AssetType[]>([]);
const assetTypesLoading = ref(false);
const brands = ref<Brand[]>([]);
const brandsLoading = ref(false);
const locations = ref<Location[]>([]);
const locationsLoading = ref(false);
const owners = ref<OwnerOption[]>([]);
const ownersLoading = ref(false);
const error = ref<string | null>(null);
const dialog = ref(false);
const isEditing = ref(false);
const editId = ref<number | null>(null);
const search = ref('');
const importLoading = ref(false);
const importErrors = ref<string[]>([]);
const importSummary = ref<string | null>(null);
const csvInput = ref<HTMLInputElement | null>(null);

type LocationValue = Location | string | null;
type OwnerValue = OwnerOption | string | null;
type AssetModelValue = AssetModel | string | null;
type AssetTypeValue = AssetType | string | null;
type BrandValue = Brand | string | null;
type PurchaseTypeValue = PurchaseType | '' | null;

interface AssetFormState {
  model: AssetModelValue;
  assetType: AssetTypeValue;
  brand: BrandValue;
  location: LocationValue;
  locationRoom: string;
  owner: OwnerValue;
  purchaseType: PurchaseTypeValue;
  expressServiceTag: string;
  noteSummary: string;
  maintenanceEnabled: boolean;
  maintenanceVendor: string;
  maintenanceDuration: string;
  maintenanceScheduledAt: string;
}

type LocationMatch = {
  id: number;
  name: string;
  room: string | null;
};

type CsvFieldKey =
  | 'type'
  | 'brand'
  | 'model'
  | 'location'
  | 'owner'
  | 'serviceTag'
  | 'notes';

interface CsvRow {
  rowNumber: number;
  type: string;
  brand: string;
  model: string;
  location: string;
  owner: string;
  serviceTag: string;
  notes: string;
}

const form = reactive<AssetFormState>({
  model: null,
  assetType: null,
  brand: null,
  location: null,
  locationRoom: '',
  owner: null,
  purchaseType: '',
  expressServiceTag: '',
  noteSummary: '',
  maintenanceEnabled: false,
  maintenanceVendor: '',
  maintenanceDuration: '',
  maintenanceScheduledAt: ''
});

const headers = [
  { title: 'Type:', key: 'type' },
  { title: 'Brand:', key: 'brand' },
  { title: 'Model:', key: 'model' },
  { title: 'Notes:', key: 'specs' },
  { title: 'Maintenance:', key: 'maintenance' },
  { title: 'Location:', key: 'location' },
  { title: 'Assigned To:', key: 'owner' },
  { title: 'Purchase:', key: 'purchaseType' },
  { title: 'Service Tag:', key: 'expressServiceTag' },
  { title: 'Updated:', key: 'updatedAt' },
  { title: 'Actions:', key: 'actions', sortable: false }
];

const purchaseTypeOptions = [
  { title: 'Purchased', value: 'purchase' },
  { title: 'Leased', value: 'leased' }
];

const csvHeaderConfig: Array<{ key: CsvFieldKey; label: string; normalized: string }> = [
  { key: 'type', label: 'Type', normalized: 'type' },
  { key: 'brand', label: 'Brand', normalized: 'brand' },
  { key: 'model', label: 'Model', normalized: 'model' },
  { key: 'location', label: 'Location + Room/Office', normalized: 'location+room/office' },
  { key: 'owner', label: 'Assigned To', normalized: 'assigned to' },
  { key: 'serviceTag', label: 'Service Tag', normalized: 'service tag' },
  { key: 'notes', label: 'Notes', normalized: 'notes' }
];

function normalizeLocationValue(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function normalizeModelTitle(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function getLocationNameKey(name: string) {
  return normalizeLocationValue(name);
}

function getLocationKey(name: string, room: string | null | undefined) {
  return `${normalizeLocationValue(name)}||${normalizeLocationValue(room ?? '')}`;
}

function getModelKey(model: AssetModel) {
  return normalizeModelTitle(model.title);
}

function buildLocationCache(list: LocationMatch[]) {
  const cache = new Map<string, LocationMatch>();
  list.forEach(item => {
    const key = getLocationKey(item.name, item.room);
    const existing = cache.get(key);
    if (!existing || item.id < existing.id) {
      cache.set(key, {
        id: item.id,
        name: item.name,
        room: item.room ?? null
      });
    }
  });
  return cache;
}

function findLocationMatch(
  name: string,
  room: string | null | undefined,
  cache: Map<string, LocationMatch>
) {
  return cache.get(getLocationKey(name, room)) ?? null;
}

const locationOptions = computed(() => {
  const cache = new Map<string, Location>();
  locations.value.forEach(location => {
    const key = getLocationNameKey(location.name);
    const existing = cache.get(key);
    if (!existing || location.id < existing.id) {
      cache.set(key, location);
    }
  });

  if (form.location && typeof form.location === 'object') {
    const selected = form.location as Location;
    const key = getLocationNameKey(selected.name);
    if (!cache.has(key)) {
      cache.set(key, selected);
    }
  }

  return Array.from(cache.values());
});

const modelOptions = computed(() => {
  const cache = new Map<string, AssetModel>();
  assetModels.value.forEach(model => {
    const key = getModelKey(model);
    const existing = cache.get(key);
    if (!existing || model.id < existing.id) {
      cache.set(key, model);
    }
  });

  if (form.model && typeof form.model === 'object') {
    const selected = form.model as AssetModel;
    const key = getModelKey(selected);
    cache.set(key, selected);
  }

  return Array.from(cache.values());
});

function getLocationOptionLabel(location: Location | string) {
  if (typeof location === 'string') return location;
  return location.name;
}

function normalizeCsvHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\s*([+\/])\s*/g, '$1');
}

function parseCsvRows(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ',') {
      row.push(field);
      field = '';
      continue;
    }

    if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      continue;
    }

    if (char === '\r') {
      if (text[i + 1] === '\n') {
        i += 1;
      }
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      continue;
    }

    field += char;
  }

  row.push(field);
  rows.push(row);

  while (rows.length && rows[rows.length - 1].every(cell => !cell || !cell.trim())) {
    rows.pop();
  }

  return rows;
}

function parseCsvContent(text: string) {
  const rows = parseCsvRows(text);
  if (!rows.length) {
    return { rows: [] as CsvRow[], errors: ['CSV is empty.'] };
  }

  const headerRow = rows[0].map(cell => cell.replace(/^\uFEFF/, '').trim());
  const normalizedHeaders = headerRow.map(normalizeCsvHeader);
  const headerIndex = new Map<string, number>();

  normalizedHeaders.forEach((header, index) => {
    if (!headerIndex.has(header)) {
      headerIndex.set(header, index);
    }
  });

  const missingHeaders = csvHeaderConfig.filter(entry => !headerIndex.has(entry.normalized));
  if (missingHeaders.length) {
    return {
      rows: [] as CsvRow[],
      errors: [
        `Missing headers: ${missingHeaders.map(entry => entry.label).join(', ')}`
      ]
    };
  }

  const getCellValue = (row: string[], normalizedHeader: string) => {
    const index = headerIndex.get(normalizedHeader);
    return index === undefined ? '' : row[index] ?? '';
  };

  const parsedRows: CsvRow[] = [];
  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    if (!row || row.every(cell => !cell || !cell.trim())) {
      continue;
    }

    parsedRows.push({
      rowNumber: i + 1,
      type: getCellValue(row, 'type').trim(),
      brand: getCellValue(row, 'brand').trim(),
      model: getCellValue(row, 'model').trim(),
      location: getCellValue(row, 'location+room/office').trim(),
      owner: getCellValue(row, 'assigned to').trim(),
      serviceTag: getCellValue(row, 'service tag').trim(),
      notes: getCellValue(row, 'notes').trim()
    });
  }

  return { rows: parsedRows, errors: [] as string[] };
}

function parseLocationParts(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return { location: '', room: '' };
  }

  const commaSplit = trimmed.split(',').map(part => part.trim()).filter(Boolean);
  if (commaSplit.length >= 2) {
    return {
      location: commaSplit[0],
      room: commaSplit.slice(1).join(', ').trim()
    };
  }

  return { location: trimmed, room: '' };
}

function openCsvImport() {
  importErrors.value = [];
  importSummary.value = null;
  if (csvInput.value) {
    csvInput.value.value = '';
    csvInput.value.click();
  }
}

function handleCsvChange(event: Event) {
  const target = event.target as HTMLInputElement | null;
  const file = target?.files?.[0];
  if (!file) return;
  void importCsv(file);
}

async function importCsv(file: File) {
  if (importLoading.value) return;
  importLoading.value = true;
  importErrors.value = [];
  importSummary.value = null;

  try {
    const text = await file.text();
    const parsed = parseCsvContent(text);
    if (parsed.errors.length) {
      importErrors.value = parsed.errors;
      return;
    }

    if (!parsed.rows.length) {
      importErrors.value = ['CSV has no data rows.'];
      return;
    }

    await Promise.all([
      loadAssetTypes(),
      loadBrands(),
      loadAssetModels(),
      loadLocations(),
      loadOwners()
    ]);

    const locationCache = buildLocationCache(locations.value);
    let imported = 0;
    const rowErrors: string[] = [];

    for (const row of parsed.rows) {
      const missingFields: string[] = [];

      if (!row.type) missingFields.push('Type');
      if (!row.brand) missingFields.push('Brand');
      if (!row.model) missingFields.push('Model');
      if (!row.location) missingFields.push('Location + Room/Office');
      if (!row.owner) missingFields.push('Assigned To');
      if (!row.serviceTag) missingFields.push('Service Tag');

      if (missingFields.length) {
        rowErrors.push(`Row ${row.rowNumber}: Missing ${missingFields.join(', ')}`);
        continue;
      }

      try {
        const { location, room } = parseLocationParts(row.location);
        const locationMatch = location
          ? findLocationMatch(location, room || null, locationCache)
          : null;
        const model = await ensureAssetModel(row.model, row.type, row.brand);

        const payload: AssetPayload = {
          assetModelId: model.id,
          expressServiceTag: row.serviceTag.trim(),
          purchaseType: null
        };

        const ownerName = row.owner.trim();
        if (ownerName) payload.owner = ownerName;
        if (locationMatch) {
          payload.locationId = locationMatch.id;
        } else if (location) {
          payload.location = location;
          if (room) payload.locationRoom = room;
        }

        const noteSummary = row.notes.trim();
        if (noteSummary.length) {
          payload.notes = [{ key: 'Notes', value: noteSummary }];
        }

        const created = await createAsset(payload);
        if (!locationMatch && location && created.locationId) {
          locationCache.set(getLocationKey(location, room || null), {
            id: created.locationId,
            name: location,
            room: room || null
          });
        }
        imported += 1;
      } catch (err) {
        rowErrors.push(
          `Row ${row.rowNumber}: ${err instanceof Error ? err.message : 'Import failed'}`
        );
      }
    }

    if (imported > 0) {
      await loadAssets();
      await loadLocations();
      await loadOwners();
      await loadAssetModels();
    }

    if (imported === 0 && rowErrors.length === 0) {
      importSummary.value = 'No rows were imported.';
    } else {
      importSummary.value = `Imported ${imported} asset${imported === 1 ? '' : 's'}.`;
      if (rowErrors.length) {
        importSummary.value += ` Skipped ${rowErrors.length} row${
          rowErrors.length === 1 ? '' : 's'
        }.`;
      }
    }

    if (rowErrors.length) {
      importErrors.value = rowErrors;
    }
  } catch (err) {
    importErrors.value = [
      err instanceof Error ? err.message : 'Failed to import CSV'
    ];
  } finally {
    importLoading.value = false;
  }
}

function resetForm() {
  form.model = null;
  form.assetType = null;
  form.brand = null;
  form.location = null;
  form.locationRoom = '';
  form.owner = null;
  form.purchaseType = '';
  form.expressServiceTag = '';
  form.noteSummary = '';
  form.maintenanceEnabled = false;
  form.maintenanceVendor = '';
  form.maintenanceDuration = '';
  form.maintenanceScheduledAt = '';
  editingAsset.value = null;
  editingMaintenance.value = null;
}

async function loadAssets() {
  loading.value = true;
  error.value = null;
  try {
    assets.value = (await fetchAssets()) || [];
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load assets';
  } finally {
    loading.value = false;
  }
}

async function loadAssetModels() {
  assetModelsLoading.value = true;
  error.value = null;
  try {
    assetModels.value = (await fetchAssetModels()) || [];
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load asset models';
  } finally {
    assetModelsLoading.value = false;
  }
}

async function loadAssetTypes() {
  assetTypesLoading.value = true;
  error.value = null;
  try {
    assetTypes.value = (await fetchAssetTypes()) || [];
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load asset types';
  } finally {
    assetTypesLoading.value = false;
  }
}

async function loadBrands() {
  brandsLoading.value = true;
  error.value = null;
  try {
    brands.value = (await fetchBrands()) || [];
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load brands';
  } finally {
    brandsLoading.value = false;
  }
}

async function loadLocations() {
  locationsLoading.value = true;
  error.value = null;
  try {
    locations.value = (await fetchLocations()) || [];
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load locations';
  } finally {
    locationsLoading.value = false;
  }
}

async function loadOwners() {
  ownersLoading.value = true;
  error.value = null;
  try {
    owners.value = (await fetchOwners()) || [];
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load owners';
  } finally {
    ownersLoading.value = false;
  }
}

function getAssetRow(item: unknown): Asset | null {
  if (!item || typeof item !== 'object') return null;
  const maybeRaw = (item as { raw?: unknown }).raw;
  if (!maybeRaw || typeof maybeRaw !== 'object') return item as Asset;
  return maybeRaw as Asset;
}

function getModelLabel(model: Asset['model']) {
  if (!model) return '—';
  const type = model.assetType?.name ?? '';
  const title = model.title || '';
  const base = [title].filter(Boolean).join('').trim();
  return `${base}` || '—';
}

function getTypeLabel(model: Asset['model']) {
  return model?.assetType?.name ?? '—';
}

function getBrandLabel(model: Asset['model']) {
  return model?.brand?.name ?? '—';
}

function formatNotes(asset: Asset | null) {
  if (!asset) return '—';
  const notes = asset.notes;
  if (!notes?.length) return '—';
  const entries = notes.slice(0, 3).map(note => `${note.value}`);
  return entries.join(', ');
}

function formatPurchaseType(value?: PurchaseType | null) {
  if (!value) return '—';
  const match = purchaseTypeOptions.find(option => option.value === value);
  return match?.title ?? value;
}

function getPrimaryMaintenance(asset: Asset | null): Maintenance | null {
  if (!asset?.maintenanceRecords?.length) return null;
  const sorted = [...asset.maintenanceRecords].sort((a, b) => {
    if (!!a.completedAt !== !!b.completedAt) {
      return a.completedAt ? 1 : -1;
    }
    return new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime();
  });
  return sorted[0];
}

function formatLocation(location: Location | string | null) {
  if (!location) return '—';
  if (typeof location === 'string') return location;
  return [location.name, location.room].filter(Boolean).join(', ') || '—';
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}

function formatDateTimeLocalInput(value: string | null | undefined) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function toIsoWithTimezone(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid maintenance date/time');
  }
  return date.toISOString();
}

function openCreate() {
  resetForm();
  isEditing.value = false;
  editId.value = null;
  dialog.value = true;
}

function setTypeBrandFromModel(model: AssetModel | null) {
  if (!model) return;
  if (model.assetType) {
    const matchedType = assetTypes.value.find(item => item.id === model.assetType?.id);
    form.assetType = matchedType ?? model.assetType;
  }
  if (model.brand) {
    const matchedBrand = brands.value.find(item => item.id === model.brand?.id);
    form.brand = matchedBrand ?? model.brand;
  }
}
function openEdit(asset: Asset) {
  const resolvedLocation =
    locations.value.find(location => location.id === asset.locationId) ?? (asset.location as Location | null) ?? null;
  const resolvedOwner = owners.value.find(owner => owner.id === asset.ownerId) ?? asset.owner ?? null;
  form.noteSummary = '';
  form.model = asset.model ?? null;
  setTypeBrandFromModel(asset.model ?? null);
  const notes = asset.notes ?? [];
  const primaryNote =
    notes.find(note => typeof note.key === 'string' && note.key.toLowerCase() === 'notes') ??
    (notes.length ? notes[0] : null);
  const noteValue = typeof primaryNote?.value === 'string' ? primaryNote.value : '';
  form.noteSummary = noteValue;
  form.location = resolvedLocation;
  form.locationRoom = (resolvedLocation as Location | null)?.room ?? '';
  form.owner = resolvedOwner;
  form.purchaseType = asset.purchaseType ?? '';
  form.expressServiceTag = asset.expressServiceTag ?? '';
  editingAsset.value = asset;
  const existingMaintenance = getPrimaryMaintenance(asset);
  editingMaintenance.value = existingMaintenance;
  if (existingMaintenance && !existingMaintenance.completedAt) {
    form.maintenanceEnabled = true;
    form.maintenanceVendor = existingMaintenance.vendor;
    form.maintenanceDuration = existingMaintenance.duration;
    form.maintenanceScheduledAt = formatDateTimeLocalInput(existingMaintenance.scheduledAt);
  } else {
    form.maintenanceEnabled = false;
    form.maintenanceVendor = '';
    form.maintenanceDuration = '';
    form.maintenanceScheduledAt = '';
  }
  editId.value = asset.id;
  isEditing.value = true;
  dialog.value = true;
}

async function ensureAssetType(value: AssetTypeValue) {
  if (value && typeof value === 'object') return value;
  const name = typeof value === 'string' ? value.trim() : '';
  if (!name.length) throw new Error('Asset type is required');
  const created = await createAssetType(name);
  assetTypes.value = [...assetTypes.value, created];
  return created;
}

async function ensureBrand(value: BrandValue) {
  if (value && typeof value === 'object') return value;
  const name = typeof value === 'string' ? value.trim() : '';
  if (!name.length) throw new Error('Brand is required');
  const created = await createBrand(name);
  brands.value = [...brands.value, created];
  return created;
}

async function ensureAssetModel(
  value: AssetModelValue,
  assetTypeValue: AssetTypeValue,
  brandValue: BrandValue
) {
  if (value && typeof value === 'object') return value;
  const title = typeof value === 'string' ? value.trim() : '';
  if (!title.length) throw new Error('Model title is required');

  const normalizedTitle = normalizeModelTitle(title);
  const existing = assetModels.value
    .filter(item => normalizeModelTitle(item.title) === normalizedTitle)
    .sort((a, b) => a.id - b.id)[0];
  if (existing) return existing;

  const resolvedType = await ensureAssetType(assetTypeValue);
  const resolvedBrand = await ensureBrand(brandValue);

  const created = await createAssetModel({
    assetTypeId: resolvedType.id,
    brandId: resolvedBrand.id,
    title
  });

  assetModels.value = [created, ...assetModels.value];
  return created;
}
async function saveAsset() {
  error.value = null;
  try {
    const serviceTag = form.expressServiceTag.trim();
    const noteSummary = form.noteSummary.trim();

    const model = await ensureAssetModel(form.model, form.assetType, form.brand);

    const payload: AssetPayload = {
      assetModelId: model.id,
      expressServiceTag: serviceTag.length ? serviceTag : null,
      purchaseType: form.purchaseType || null
    };
    payload.notes = noteSummary.length ? [{ key: 'Notes', value: noteSummary }] : [];

    const locationName =
      form.location && typeof form.location === 'object'
        ? form.location.name.trim()
        : typeof form.location === 'string'
          ? form.location.trim()
          : '';
    const room = form.locationRoom.trim();

    if (locationName.length) {
      const locationCache = buildLocationCache(locations.value);
      const locationMatch = findLocationMatch(locationName, room || null, locationCache);
      if (locationMatch) {
        payload.locationId = locationMatch.id;
      } else {
        payload.location = locationName;
        if (room.length) payload.locationRoom = room;
      }
    }

    if (form.owner && typeof form.owner === 'object') {
      payload.ownerId = form.owner.id;
    } else if (typeof form.owner === 'string') {
      const ownerName = form.owner.trim();
      if (ownerName.length) payload.owner = ownerName;
    }

    if (form.maintenanceEnabled) {
      const vendor = form.maintenanceVendor.trim();
      const duration = form.maintenanceDuration.trim();
      const scheduledAt = form.maintenanceScheduledAt.trim();
      if (vendor && duration && scheduledAt) {
        const scheduledAtIso = toIsoWithTimezone(scheduledAt);
        payload.maintenance = {
          vendor,
          duration,
          scheduledAt: scheduledAtIso
        };
      }
    }

    if (
      (payload.locationId === undefined && !payload.location) ||
      (payload.ownerId === undefined && !payload.owner)
    ) {
      throw new Error('Location and Owner are required');
    }

    if (isEditing.value && editId.value !== null) {
      const updated = await updateAsset(editId.value, payload);
      assets.value = assets.value.map(asset => (asset.id === updated.id ? updated : asset));
    } else {
      const created = await createAsset(payload);
      assets.value = [created, ...assets.value];
    }

    dialog.value = false;
    resetForm();
    await loadLocations();
    await loadOwners();
    await loadAssetModels();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Save failed';
  }
}

async function markMaintenanceCompleted(asset: Asset, maintenance: Maintenance) {
  if (completingMaintenanceId.value === maintenance.id) return;
  completingMaintenanceId.value = maintenance.id;
  error.value = null;
  try {
    const updated = await completeMaintenance(asset.id, maintenance.id);
    assets.value = assets.value.map(item => (item.id === updated.id ? updated : item));
    if (editId.value === updated.id) {
      editingAsset.value = updated;
      const nextMaintenance = getPrimaryMaintenance(updated);
      editingMaintenance.value = nextMaintenance;
      if (nextMaintenance && !nextMaintenance.completedAt) {
        form.maintenanceEnabled = true;
        form.maintenanceVendor = nextMaintenance.vendor;
        form.maintenanceDuration = nextMaintenance.duration;
        form.maintenanceScheduledAt = formatDateTimeLocalInput(nextMaintenance.scheduledAt);
      } else {
        form.maintenanceEnabled = false;
        form.maintenanceVendor = '';
        form.maintenanceDuration = '';
        form.maintenanceScheduledAt = '';
      }
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to update maintenance';
  } finally {
    completingMaintenanceId.value = null;
  }
}

async function confirmDelete(asset: Asset) {
  const confirmed = window.confirm(`Delete asset ${asset.expressServiceTag || '—'}?`);
  if (!confirmed) return;
  try {
    await deleteAsset(asset.id);
    assets.value = assets.value.filter(item => item.id !== asset.id);
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Delete failed';
  }
}

onMounted(() => {
  loadAssets();
  loadAssetModels();
  loadAssetTypes();
  loadBrands();
  loadLocations();
  loadOwners();
});
</script>

<template>
  <v-card elevation="1">
    <v-toolbar color="primary" density="comfortable" class="text-white">
      <v-toolbar-title class="text-h6 font-weight-bold">Assets</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn
        color="white"
        variant="flat"
        class="mr-2"
        :loading="importLoading"
        :disabled="importLoading"
        @click="openCsvImport"
      >
        <v-icon icon="mdi-file-upload" start></v-icon>
        Import CSV
      </v-btn>
      <v-btn color="white" variant="flat" @click="openCreate">
        <v-icon icon="mdi-plus" start></v-icon>
        Add Asset
      </v-btn>
    </v-toolbar>
    <input
      ref="csvInput"
      type="file"
      accept=".csv,text/csv"
      style="display: none"
      :disabled="importLoading"
      @change="handleCsvChange"
    />

    <v-card-text>
      <v-alert v-if="importSummary" type="success" density="compact" class="mb-3">
        {{ importSummary }}
      </v-alert>
      <v-alert v-if="importErrors.length" type="error" density="compact" class="mb-3">
        <div v-for="(message, index) in importErrors" :key="index">
          {{ message }}
        </div>
      </v-alert>
      <v-row class="mb-4" align="center" no-gutters>
        <v-col cols="12" md="6" class="pr-md-4">
          <v-text-field
            v-model="search"
            label="Search"
            prepend-inner-icon="mdi-magnify"
            clearable
            density="comfortable"
          ></v-text-field>
        </v-col>
        <v-col cols="12" md="6">
          <v-alert v-if="error" type="error" density="compact" class="mb-2">
            {{ error }}
          </v-alert>
        </v-col>
      </v-row>

      <v-data-table
        :headers="headers"
        :items="assets"
        :search="search"
        :loading="loading"
        item-value="id"
        hover
        density="comfortable"
        hide-default-footer
        :items-per-page="-1"
      >
        <template #item.type="{ item }">
          <span>{{ getTypeLabel(getAssetRow(item)?.model ?? null) }}</span>
        </template>
        <template #item.brand="{ item }">
          <span>{{ getBrandLabel(getAssetRow(item)?.model ?? null) }}</span>
        </template>
        <template #item.model="{ item }">
          <span>{{ getModelLabel(getAssetRow(item)?.model ?? null) }}</span>
        </template>
        <template #item.specs="{ item }">
          <span>{{ formatNotes(getAssetRow(item)) }}</span>
        </template>
        <template #item.maintenance="{ item }">
          <template v-if="getAssetRow(item)">
            <template v-if="getPrimaryMaintenance(getAssetRow(item)!)">
              <div class="d-flex flex-column">
                <div class="d-flex align-center flex-wrap" style="gap: 8px">
                  <v-chip
                    size="x-small"
                    label
                    :color="getPrimaryMaintenance(getAssetRow(item)!)?.completedAt ? 'success' : 'warning'"
                  >
                    {{ getPrimaryMaintenance(getAssetRow(item)!)?.completedAt ? 'Completed' : 'Scheduled' }}
                  </v-chip>
                  <span class="text-body-2 font-weight-medium">
                    {{ getPrimaryMaintenance(getAssetRow(item)!)?.vendor }}
                    <span class="text-medium-emphasis">
                      • {{ getPrimaryMaintenance(getAssetRow(item)!)?.duration }}
                    </span>
                  </span>
                </div>
                <div class="text-caption text-medium-emphasis mt-1">
                  {{
                    getPrimaryMaintenance(getAssetRow(item)!)?.completedAt
                      ? `Done ${formatDate(getPrimaryMaintenance(getAssetRow(item)!)?.completedAt)}`
                      : `Scheduled ${formatDate(getPrimaryMaintenance(getAssetRow(item)!)?.scheduledAt)}`
                  }}
                </div>
                <div v-if="!getPrimaryMaintenance(getAssetRow(item)!)?.completedAt" class="mt-1">
                  <v-btn
                    size="x-small"
                    variant="text"
                    color="primary"
                    :loading="completingMaintenanceId === getPrimaryMaintenance(getAssetRow(item)!)?.id"
                    :disabled="!getPrimaryMaintenance(getAssetRow(item)!)"
                    @click="
                      getAssetRow(item) &&
                        getPrimaryMaintenance(getAssetRow(item)!) &&
                        markMaintenanceCompleted(getAssetRow(item)!, getPrimaryMaintenance(getAssetRow(item)!)!)
                    "
                  >
                    Mark completed
                  </v-btn>
                </div>
              </div>
            </template>
            <span v-else>—</span>
          </template>
          <span v-else>—</span>
        </template>
        <template #item.location="{ item }">
          <span>{{ formatLocation(getAssetRow(item)?.location ?? null) }}</span>
        </template>
        <template #item.owner="{ item }">
          <span>{{ getAssetRow(item)?.owner ?? '—' }}</span>
        </template>
        <template #item.purchaseType="{ item }">
          <span>{{ formatPurchaseType(getAssetRow(item)?.purchaseType ?? null) }}</span>
        </template>
        <template #item.expressServiceTag="{ item }">
          <span>{{ getAssetRow(item)?.expressServiceTag || '—' }}</span>
        </template>
        <template #item.updatedAt="{ item }">
          <span>
            {{ formatDate(getAssetRow(item)?.updatedAt) }}
          </span>
        </template>
        <template #item.actions="{ item }">
          <v-btn
            size="small"
            variant="text"
            color="primary"
            :disabled="!getAssetRow(item)"
            @click="getAssetRow(item) && openEdit(getAssetRow(item)!)"
          >
            Edit
          </v-btn>
          <v-btn
            size="small"
            variant="text"
            color="error"
            :disabled="!getAssetRow(item)"
            @click="getAssetRow(item) && confirmDelete(getAssetRow(item)!)"
          >
            Delete
          </v-btn>
        </template>
        <template #no-data>
          <v-empty-state
            title="No assets yet"
            text="Add your first asset to get started."
            icon="mdi-clipboard-list-outline"
          >
            <template #actions>
              <v-btn color="primary" @click="openCreate">Add asset</v-btn>
            </template>
          </v-empty-state>
        </template>
      </v-data-table>
    </v-card-text>
  </v-card>

  <v-dialog v-model="dialog" max-width="640" persistent>
    <v-card>
      <v-card-title class="text-h6">
        {{ isEditing ? 'Edit Asset' : 'Add Asset' }}
      </v-card-title>
      <v-card-text>
        <v-form @submit.prevent="saveAsset">
          <v-combobox
            v-model="form.model"
            :items="modelOptions"
            return-object
            item-title="title"
            item-value="id"
            label="Model"
            required
            density="comfortable"
            variant="outlined"
            :loading="assetModelsLoading"
            :disabled="assetModelsLoading"
          ></v-combobox>
          <v-row>
            <v-col cols="12" md="6">
              <v-combobox
                v-model="form.assetType"
                :items="assetTypes"
                item-title="name"
                item-value="id"
                return-object
                label="Type"
                required
                density="comfortable"
                variant="outlined"
                :loading="assetTypesLoading"
                :disabled="assetTypesLoading"
              ></v-combobox>
            </v-col>
            <v-col cols="12" md="6">
              <v-combobox
                v-model="form.brand"
                :items="brands"
                item-title="name"
                item-value="id"
                return-object
                label="Brand"
                required
                density="comfortable"
                variant="outlined"
                :loading="brandsLoading"
                :disabled="brandsLoading"
              ></v-combobox>
            </v-col>
          </v-row>
          <v-combobox
            v-model="form.location"
            :items="locationOptions"
            :item-title="getLocationOptionLabel"
            item-value="id"
            label="Location"
            required
            density="comfortable"
            variant="outlined"
            :loading="locationsLoading"
            :disabled="locationsLoading"
            return-object
          ></v-combobox>
          <v-text-field
            v-model="form.locationRoom"
            label="Room / Office (optional)"
            density="comfortable"
            variant="outlined"
          ></v-text-field>
          <v-combobox
            v-model="form.owner"
            :items="owners"
            item-title="name"
            item-value="id"
            label="Owner/User"
            required
            density="comfortable"
            variant="outlined"
            :loading="ownersLoading"
            :disabled="ownersLoading"
            return-object
          ></v-combobox>
          <v-select
            v-model="form.purchaseType"
            :items="purchaseTypeOptions"
            item-title="title"
            item-value="value"
            label="Purchase Type"
            density="comfortable"
            variant="outlined"
            clearable
          ></v-select>
          <v-text-field
            v-model="form.expressServiceTag"
            label="Service Tag"
            density="comfortable"
            variant="outlined"
            clearable
          ></v-text-field>
          <v-checkbox
            v-model="form.maintenanceEnabled"
            label="Add maintenance"
            density="comfortable"
          ></v-checkbox>
          <v-expand-transition>
            <div v-if="form.maintenanceEnabled">
              <v-text-field
                v-model="form.maintenanceVendor"
                label="Maintenance Vendor"
                density="comfortable"
                variant="outlined"
              ></v-text-field>
              <v-text-field
                v-model="form.maintenanceDuration"
                label="Duration"
                density="comfortable"
                variant="outlined"
              ></v-text-field>
              <v-text-field
                v-model="form.maintenanceScheduledAt"
                label="Scheduled date/time"
                type="datetime-local"
                density="comfortable"
                variant="outlined"
              ></v-text-field>
            </div>
          </v-expand-transition>
          <div v-if="editingMaintenance" class="mt-2">
            <div class="d-flex align-center flex-wrap" style="gap: 8px">
              <v-chip
                size="x-small"
                label
                :color="editingMaintenance.completedAt ? 'success' : 'warning'"
              >
                {{ editingMaintenance.completedAt ? 'Completed' : 'Scheduled' }}
              </v-chip>
              <span class="text-body-2 font-weight-medium">
                {{ editingMaintenance.vendor }}
                <span class="text-medium-emphasis">
                  • {{ editingMaintenance.duration }}
                </span>
              </span>
            </div>
            <div class="text-caption text-medium-emphasis mt-1">
              {{
                editingMaintenance.completedAt
                  ? `Done ${formatDate(editingMaintenance.completedAt)}`
                  : `Scheduled ${formatDate(editingMaintenance.scheduledAt)}`
              }}
            </div>
            <div v-if="editingAsset && !editingMaintenance.completedAt" class="mt-1">
              <v-btn
                size="x-small"
                variant="text"
                color="primary"
                :loading="completingMaintenanceId === editingMaintenance.id"
                @click="markMaintenanceCompleted(editingAsset, editingMaintenance)"
              >
                Mark completed
              </v-btn>
            </div>
          </div>
          <v-textarea
            v-model="form.noteSummary"
            label="Notes"
            density="comfortable"
            variant="outlined"
            auto-grow
            rows="2"
          ></v-textarea>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="dialog = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" @click="saveAsset">
          {{ isEditing ? 'Save changes' : 'Create asset' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
