<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import {
  Asset,
  AssetModel,
  AssetPayload,
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

type LocationValue = Location | string | null;
type OwnerValue = OwnerOption | string | null;
type AssetModelValue = AssetModel | string | null;
type AssetTypeValue = AssetType | string | null;
type BrandValue = Brand | string | null;

interface AssetFormState {
  model: AssetModelValue;
  assetType: AssetTypeValue;
  brand: BrandValue;
  location: LocationValue;
  owner: OwnerValue;
  expressServiceTag: string;
  specSummary: string;
}

const form = reactive<AssetFormState>({
  model: null,
  assetType: null,
  brand: null,
  location: null,
  owner: null,
  expressServiceTag: '',
  specSummary: ''
});

const headers = [
  { title: 'Type:', key: 'type' },
  { title: 'Brand:', key: 'brand' },
  { title: 'Model:', key: 'model' },
  { title: 'Specs:', key: 'specs' },
  { title: 'Location:', key: 'location' },
  { title: 'Assigned To:', key: 'owner' },
  { title: 'Service Tag:', key: 'expressServiceTag' },
  { title: 'Updated:', key: 'updatedAt' },
  { title: 'Actions:', key: 'actions', sortable: false }
];

function resetForm() {
  form.model = null;
  form.assetType = null;
  form.brand = null;
  form.location = null;
  form.owner = null;
  form.expressServiceTag = '';
  form.specSummary = '';
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
  const brand = model.brand?.name ?? '';
  const type = model.assetType?.name ?? '';
  const title = model.title || '';
  const typeSuffix = type ? ` (${type})` : '';
  const base = [brand, title].filter(Boolean).join(' ').trim();
  return `${base}${typeSuffix}` || '—';
}

function getTypeLabel(model: Asset['model']) {
  return model?.assetType?.name ?? '—';
}

function getBrandLabel(model: Asset['model']) {
  return model?.brand?.name ?? '—';
}

function formatSpecs(model: Asset['model']) {
  if (!model) return '—';
  if (model.specSummary) return model.specSummary;
  if (!model.specs?.length) return '—';
  const entries = model.specs.slice(0, 3).map(spec => `${spec.key}: ${spec.value}`);
  return entries.join(', ');
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
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
  if (model.specSummary) {
    form.specSummary = model.specSummary;
  }
}

function openEdit(asset: Asset) {
  const resolvedLocation =
    locations.value.find(location => location.id === asset.locationId) ?? asset.location ?? null;
  const resolvedOwner = owners.value.find(owner => owner.id === asset.ownerId) ?? asset.owner ?? null;
  form.model = asset.model ?? null;
  setTypeBrandFromModel(asset.model ?? null);
  form.location = resolvedLocation;
  form.owner = resolvedOwner;
  form.expressServiceTag = asset.expressServiceTag ?? '';
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
  brandValue: BrandValue,
  specSummary: string
) {
  if (value && typeof value === 'object') return value;
  const title = typeof value === 'string' ? value.trim() : '';
  if (!title.length) throw new Error('Model title is required');

  const resolvedType = await ensureAssetType(assetTypeValue);
  const resolvedBrand = await ensureBrand(brandValue);

  const created = await createAssetModel({
    assetTypeId: resolvedType.id,
    brandId: resolvedBrand.id,
    title,
    specSummary: specSummary.trim().length ? specSummary.trim() : null
  });

  assetModels.value = [created, ...assetModels.value];
  return created;
}

async function saveAsset() {
  error.value = null;
  try {
    const serviceTag = form.expressServiceTag.trim();
    const specSummary = form.specSummary.trim();

    const model = await ensureAssetModel(form.model, form.assetType, form.brand, specSummary);

    const payload: AssetPayload = {
      assetModelId: model.id,
      expressServiceTag: serviceTag.length ? serviceTag : null
    };

    if (form.location && typeof form.location === 'object') {
      payload.locationId = form.location.id;
    } else if (typeof form.location === 'string') {
      const locationName = form.location.trim();
      if (locationName.length) payload.location = locationName;
    }

    if (form.owner && typeof form.owner === 'object') {
      payload.ownerId = form.owner.id;
    } else if (typeof form.owner === 'string') {
      const ownerName = form.owner.trim();
      if (ownerName.length) payload.owner = ownerName;
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
      <v-btn color="white" variant="flat" @click="openCreate">
        <v-icon icon="mdi-plus" start></v-icon>
        Add Asset
      </v-btn>
    </v-toolbar>

    <v-card-text>
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
          <span>{{ formatSpecs(getAssetRow(item)?.model ?? null) }}</span>
        </template>
        <template #item.location="{ item }">
          <span>{{ getAssetRow(item)?.location ?? '—' }}</span>
        </template>
        <template #item.owner="{ item }">
          <span>{{ getAssetRow(item)?.owner ?? '—' }}</span>
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
            :items="assetModels"
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
            :items="locations"
            item-title="name"
            item-value="id"
            label="Location"
            required
            density="comfortable"
            variant="outlined"
            :loading="locationsLoading"
            :disabled="locationsLoading"
            return-object
          ></v-combobox>
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
          <v-text-field
            v-model="form.expressServiceTag"
            label="Service Tag"
            density="comfortable"
            variant="outlined"
            clearable
          ></v-text-field>
          <v-textarea
            v-model="form.specSummary"
            label="Specs (summary)"
            hint="Optional: short specs like CPU/RAM/etc."
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
