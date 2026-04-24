<script setup lang="ts">
import { computed } from 'vue';
import type { Asset, Maintenance, PurchaseType } from '../api/assets';
import type { Location } from '../api/locations';

export type ReportType = 'inventory' | 'by-location' | 'by-owner' | 'maintenance';

const props = defineProps<{
  assets: Asset[];
  reportType: ReportType;
}>();

const emit = defineEmits<{ close: [] }>();

const reportTitles: Record<ReportType, string> = {
  inventory: 'Full Inventory Report',
  'by-location': 'Assets by Location',
  'by-owner': 'Assets by Owner',
  maintenance: 'Maintenance Report'
};

const reportTitle = computed(() => reportTitles[props.reportType]);

const generatedDate = new Date().toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

function getTypeLabel(asset: Asset) {
  return asset.model?.assetType?.name ?? '—';
}

function getBrandLabel(asset: Asset) {
  return asset.model?.brand?.name ?? '—';
}

function getModelLabel(asset: Asset) {
  return asset.model?.title || '—';
}

function getLocationLabel(asset: Asset) {
  const loc = asset.location;
  if (!loc) return '—';
  if (typeof loc === 'string') return loc;
  const l = loc as Location;
  return [l.name, l.room].filter(Boolean).join(', ') || '—';
}

function getOwnerLabel(asset: Asset) {
  return asset.owner ?? '—';
}

function getNotesLabel(asset: Asset) {
  const notes = asset.notes ?? [];
  if (!notes.length) return '—';
  return notes.map(n => n.value).join(', ');
}

function formatPurchaseType(value?: PurchaseType | null) {
  if (!value) return '—';
  return value === 'purchase' ? 'Purchased' : 'Leased';
}

function getPrimaryMaintenance(asset: Asset): Maintenance | null {
  if (!asset?.maintenanceRecords?.length) return null;
  const sorted = [...asset.maintenanceRecords].sort((a, b) => {
    if (!!a.completedAt !== !!b.completedAt) return a.completedAt ? 1 : -1;
    return new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime();
  });
  return sorted[0];
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
}

function isOverdue(maintenance: Maintenance) {
  return !maintenance.completedAt && new Date(maintenance.scheduledAt) < new Date();
}

function triggerPrint() {
  window.print();
}

const flatAssets = computed(() =>
  [...props.assets].sort((a, b) => {
    const typeCompare = getTypeLabel(a).localeCompare(getTypeLabel(b));
    if (typeCompare !== 0) return typeCompare;
    return getBrandLabel(a).localeCompare(getBrandLabel(b));
  })
);

const byLocation = computed(() => {
  const groups = new Map<string, Asset[]>();
  for (const asset of props.assets) {
    const key = getLocationLabel(asset);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(asset);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([location, assets]) => ({ location, assets }));
});

const byOwner = computed(() => {
  const groups = new Map<string, Asset[]>();
  for (const asset of props.assets) {
    const key = getOwnerLabel(asset);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(asset);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([owner, assets]) => ({ owner, assets }));
});

const maintenanceAssets = computed(() =>
  [...props.assets]
    .filter(a => getPrimaryMaintenance(a) !== null)
    .sort((a, b) => {
      const ma = getPrimaryMaintenance(a)!;
      const mb = getPrimaryMaintenance(b)!;
      if (!!ma.completedAt !== !!mb.completedAt) return ma.completedAt ? 1 : -1;
      const aOver = isOverdue(ma);
      const bOver = isOverdue(mb);
      if (aOver !== bOver) return aOver ? -1 : 1;
      return new Date(ma.scheduledAt).getTime() - new Date(mb.scheduledAt).getTime();
    })
);
</script>

<template>
  <div class="print-overlay">
    <div class="print-overlay__actions no-print">
      <button class="action-btn" @click="emit('close')">← Back</button>
      <button class="action-btn action-btn--primary" @click="triggerPrint">
        Print / Save as PDF
      </button>
    </div>

    <div class="report-page">
      <div class="report-header">
        <div class="report-header__company">Qualgen IT Assets</div>
        <div class="report-header__title">{{ reportTitle }}</div>
        <div class="report-header__meta">
          Generated: {{ generatedDate }} &nbsp;·&nbsp; Total assets: {{ assets.length }}
        </div>
      </div>

      <!-- Full inventory -->
      <template v-if="reportType === 'inventory'">
        <table class="report-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Brand</th>
              <th>Model</th>
              <th>Location</th>
              <th>Owner</th>
              <th>Service Tag</th>
              <th>Purchase</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="asset in flatAssets" :key="asset.id">
              <td>{{ getTypeLabel(asset) }}</td>
              <td>{{ getBrandLabel(asset) }}</td>
              <td>{{ getModelLabel(asset) }}</td>
              <td>{{ getLocationLabel(asset) }}</td>
              <td>{{ getOwnerLabel(asset) }}</td>
              <td>{{ asset.expressServiceTag || '—' }}</td>
              <td>{{ formatPurchaseType(asset.purchaseType) }}</td>
              <td>{{ getNotesLabel(asset) }}</td>
            </tr>
          </tbody>
        </table>
      </template>

      <!-- By location -->
      <template v-else-if="reportType === 'by-location'">
        <div v-for="group in byLocation" :key="group.location" class="report-group">
          <div class="report-group__header">
            <span class="report-group__title">{{ group.location }}</span>
            <span class="report-group__count">
              {{ group.assets.length }} asset{{ group.assets.length !== 1 ? 's' : '' }}
            </span>
          </div>
          <table class="report-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Brand</th>
                <th>Model</th>
                <th>Owner</th>
                <th>Service Tag</th>
                <th>Purchase</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="asset in group.assets" :key="asset.id">
                <td>{{ getTypeLabel(asset) }}</td>
                <td>{{ getBrandLabel(asset) }}</td>
                <td>{{ getModelLabel(asset) }}</td>
                <td>{{ getOwnerLabel(asset) }}</td>
                <td>{{ asset.expressServiceTag || '—' }}</td>
                <td>{{ formatPurchaseType(asset.purchaseType) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <!-- By owner -->
      <template v-else-if="reportType === 'by-owner'">
        <div v-for="group in byOwner" :key="group.owner" class="report-group">
          <div class="report-group__header">
            <span class="report-group__title">{{ group.owner }}</span>
            <span class="report-group__count">
              {{ group.assets.length }} asset{{ group.assets.length !== 1 ? 's' : '' }}
            </span>
          </div>
          <table class="report-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Brand</th>
                <th>Model</th>
                <th>Location</th>
                <th>Service Tag</th>
                <th>Purchase</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="asset in group.assets" :key="asset.id">
                <td>{{ getTypeLabel(asset) }}</td>
                <td>{{ getBrandLabel(asset) }}</td>
                <td>{{ getModelLabel(asset) }}</td>
                <td>{{ getLocationLabel(asset) }}</td>
                <td>{{ asset.expressServiceTag || '—' }}</td>
                <td>{{ formatPurchaseType(asset.purchaseType) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <!-- Maintenance report -->
      <template v-else-if="reportType === 'maintenance'">
        <div v-if="!maintenanceAssets.length" class="report-empty">
          No assets with maintenance records found.
        </div>
        <table v-else class="report-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Brand / Model</th>
              <th>Owner</th>
              <th>Location</th>
              <th>Service Tag</th>
              <th>Vendor</th>
              <th>Duration</th>
              <th>Scheduled</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="asset in maintenanceAssets" :key="asset.id">
              <td>{{ getTypeLabel(asset) }}</td>
              <td>{{ getBrandLabel(asset) }} {{ getModelLabel(asset) }}</td>
              <td>{{ getOwnerLabel(asset) }}</td>
              <td>{{ getLocationLabel(asset) }}</td>
              <td>{{ asset.expressServiceTag || '—' }}</td>
              <td>{{ getPrimaryMaintenance(asset)?.vendor ?? '—' }}</td>
              <td>{{ getPrimaryMaintenance(asset)?.duration ?? '—' }}</td>
              <td :class="{ 'cell--overdue': isOverdue(getPrimaryMaintenance(asset)!) }">
                {{ formatDate(getPrimaryMaintenance(asset)?.scheduledAt) }}
              </td>
              <td>
                <span v-if="getPrimaryMaintenance(asset)?.completedAt" class="status status--complete">Completed</span>
                <span v-else-if="isOverdue(getPrimaryMaintenance(asset)!)" class="status status--overdue">Overdue</span>
                <span v-else class="status status--scheduled">Scheduled</span>
              </td>
            </tr>
          </tbody>
        </table>
      </template>

      <div class="report-footer">
        Qualgen IT Assets &nbsp;·&nbsp; Printed {{ generatedDate }}
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── Screen ───────────────────────────────────────────────── */
.print-overlay {
  position: fixed;
  inset: 0;
  background: #f2f4f7;
  z-index: 9999;
  overflow-y: auto;
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.print-overlay__actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 24px;
  background: #1565c0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.action-btn {
  padding: 7px 18px;
  border: 1px solid rgba(255, 255, 255, 0.45);
  background: transparent;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  font-family: inherit;
  transition: background 0.15s;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.12);
}

.action-btn--primary {
  background: white;
  color: #1565c0;
  border-color: white;
  font-weight: 600;
}

.action-btn--primary:hover {
  background: #e3f2fd;
}

.report-page {
  max-width: 1100px;
  margin: 24px auto 48px;
  background: white;
  padding: 40px 48px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* ── Report header ────────────────────────────────────────── */
.report-header {
  margin-bottom: 28px;
  border-bottom: 2px solid #1565c0;
  padding-bottom: 14px;
}

.report-header__company {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #1565c0;
}

.report-header__title {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  margin: 4px 0 2px;
}

.report-header__meta {
  font-size: 12px;
  color: #64748b;
}

/* ── Table ────────────────────────────────────────────────── */
.report-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  margin-bottom: 8px;
}

.report-table th {
  background: #f1f5f9;
  text-align: left;
  padding: 7px 10px;
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #475569;
  border-bottom: 1px solid #cbd5e1;
}

.report-table td {
  padding: 7px 10px;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: top;
  color: #0f172a;
}

.report-table tbody tr:last-child td {
  border-bottom: none;
}

.report-table tbody tr:hover {
  background: #f8fafc;
}

/* ── Groups ───────────────────────────────────────────────── */
.report-group {
  margin-bottom: 28px;
  page-break-inside: avoid;
}

.report-group__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  background: #1565c0;
  color: white;
}

.report-group__title {
  font-weight: 600;
  font-size: 13px;
}

.report-group__count {
  font-size: 11px;
  opacity: 0.8;
}

/* ── Status badges ────────────────────────────────────────── */
.status {
  font-weight: 600;
  font-size: 11px;
}

.status--complete { color: #16a34a; }
.status--overdue  { color: #dc2626; }
.status--scheduled { color: #d97706; }

.cell--overdue { color: #dc2626; }

/* ── Misc ─────────────────────────────────────────────────── */
.report-empty {
  color: #64748b;
  text-align: center;
  padding: 48px 0;
  font-size: 14px;
}

.report-footer {
  margin-top: 36px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
  font-size: 11px;
  color: #94a3b8;
  text-align: center;
}

/* ── Print ────────────────────────────────────────────────── */
@media print {
  .no-print {
    display: none !important;
  }

  .print-overlay {
    position: static;
    background: white;
    overflow: visible;
  }

  .report-page {
    max-width: 100%;
    margin: 0;
    padding: 0;
    box-shadow: none;
  }

  .report-table {
    font-size: 11px;
  }

  .report-table th {
    font-size: 10px;
  }

  .report-group {
    page-break-inside: avoid;
  }

  .report-header {
    margin-bottom: 20px;
  }
}
</style>
