<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import {
  Asset,
  AssetPayload,
  createAsset,
  deleteAsset,
  fetchAssets,
  updateAsset
} from '../api/assets';
import { fetchLocations, Location } from '../api/locations';
import { fetchOwners, Owner as OwnerOption } from '../api/owners';

const assets = ref<Asset[]>([]);
const loading = ref(false);
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

interface AssetFormState {
  number: string;
  name: string;
  location: LocationValue;
  owner: OwnerValue;
  expressServiceTag: string;
}

const form = reactive<AssetFormState>({
  number: '',
  name: '',
  location: null,
  owner: null,
  expressServiceTag: ''
});

const headers = [
  { title: 'Name:', key: 'name' },
  { title: 'Location:', key: 'location' },
  { title: 'Assigned To:', key: 'owner' },
  { title: 'Service Tag:', key: 'expressServiceTag' },
  { title: 'Updated:', key: 'updatedAt' },
  { title: 'Actions:', key: 'actions', sortable: false }
];

function resetForm() {
  form.name = '';
  form.location = null;
  form.owner = null;
  form.expressServiceTag = '';
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

function openEdit(asset: Asset) {
  const resolvedLocation =
    locations.value.find(location => location.id === asset.locationId) ?? asset.location ?? null;
  const resolvedOwner = owners.value.find(owner => owner.id === asset.ownerId) ?? asset.owner ?? null;
  form.name = asset.name;
  form.location = resolvedLocation;
  form.owner = resolvedOwner;
  form.expressServiceTag = asset.expressServiceTag ?? '';
  editId.value = asset.id;
  isEditing.value = true;
  dialog.value = true;
}

async function saveAsset() {
  error.value = null;
  try {
    const name = form.name.trim();
    const serviceTag = form.expressServiceTag.trim();

    const payload: AssetPayload = {
      name,
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
      !name ||
      (payload.locationId === undefined && !payload.location) ||
      (payload.ownerId === undefined && !payload.owner)
    ) {
      throw new Error('All fields are required');
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
        <template #item.updatedAt="{ item }">
          <span>
            {{ formatDate(getAssetRow(item)?.updatedAt) }}
          </span>
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

  <v-dialog v-model="dialog" max-width="520" persistent>
    <v-card>
      <v-card-title class="text-h6">
        {{ isEditing ? 'Edit Asset' : 'Add Asset' }}
      </v-card-title>
      <v-card-text>
        <v-form @submit.prevent="saveAsset">
          <v-text-field
            v-model="form.name"
            label="Asset Name"
            required
            density="comfortable"
            variant="outlined"
          ></v-text-field>
          <v-combobox
            v-model="form.location"
            :items="locations"
            item-title="name"
            item-value="id"
            return-object
            label="Location"
            required
            density="comfortable"
            variant="outlined"
            :loading="locationsLoading"
            :disabled="locationsLoading"
          ></v-combobox>
          <v-combobox
            v-model="form.owner"
            :items="owners"
            item-title="name"
            item-value="id"
            return-object
            label="Owner/User"
            required
            density="comfortable"
            variant="outlined"
            :loading="ownersLoading"
            :disabled="ownersLoading"
          ></v-combobox>
          <v-text-field
            v-model="form.expressServiceTag"
            label="Service Tag"
            density="comfortable"
            variant="outlined"
            clearable
          ></v-text-field>
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
