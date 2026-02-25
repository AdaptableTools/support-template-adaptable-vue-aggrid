<script setup lang="ts">
import { ref, shallowRef, onMounted, onBeforeUnmount } from 'vue';
import {
  AdaptableAgGridVue,
  AdaptableProvider,
  AdaptableUI,
  type AdaptableOptions,
  type AdaptableReadyInfo,
} from '@adaptabletools/adaptable-vue3-aggrid';
import { adaptableLicense } from './config';
import { agGridModules } from './agGridModules';
import { prepareGridOptions } from './prepareGridOptions';
import {
  getOrderColumnDefs,
  getTableColumnIds,
  getNumDuplicateSets,
} from './testing-data/big-data/columnDefs';
import {
  fetchOrdersData,
  extendRowDataWithDuplicateColumns,
  type ExtendedOrderData,
} from './testing-data/big-data/rowData';
import type { GridOptions } from 'ag-grid-community';

/**
 * ---------- DATA SIZE CONFIGURATION ----------
 * Adjust these to control the volume of test data.
 * NUM_ROWS:    max rows fetched from the API (capped at 30k server-side)
 * NUM_COLUMNS: target column count; non-numeric columns appear once,
 *              numeric columns (price, amount, invoiceNum) are duplicated
 *              in sets until we reach this target.
 */
const NUM_ROWS = 30_000;
const NUM_COLUMNS = 200;

// ---------- Loading-phase state ----------
type Phase =
  | 'fetching'
  | 'preparingData'
  | 'preparingColumns'
  | 'ready'
  | 'error';

const phase = ref<Phase>('fetching');
const fetchedRowCount = ref<number | null>(null);
const preparedData = shallowRef<ExtendedOrderData[] | null>(null);
const errorMessage = ref<string | null>(null);
const showGrid = ref(false);

const cancelled = ref(false);

/**
 * ---------- DATA PREPARATION PIPELINE ----------
 * Runs on mount in three phases, each reflected in the loading UI:
 *
 * 1. FETCH   – pull raw order rows from the remote API
 * 2. PREPARE DATA  – normalise prices for specific products so that the
 *                     "only" aggregation resolves to a concrete value,
 *                     then duplicate numeric fields to reach NUM_COLUMNS
 * 3. PREPARE COLUMNS – build column definitions & column-id lists
 */
onMounted(() => {
  (async () => {
    try {
      // --- Phase 1: Fetch raw data ---
      phase.value = 'fetching';
      errorMessage.value = null;
      fetchedRowCount.value = null;

      const data = await fetchOrdersData(NUM_ROWS);
      if (cancelled.value) return;
      fetchedRowCount.value = data.length;

      // Force uniform price within these product groups so the "only"
      // aggregation shows a real value instead of "*" (mixed).
      const uniformPriceProducts = ['Hat', 'Tuna'];
      for (const name of uniformPriceProducts) {
        const rows = data.filter((r) => r.prodName === name);
        if (rows.length > 0) {
          const price = rows[0].price;
          for (const row of rows) {
            row.price = price;
          }
        }
      }

      // --- Phase 2: Extend row data with duplicated numeric fields ---
      phase.value = 'preparingData';
      const numDuplicateSets = getNumDuplicateSets(NUM_COLUMNS);
      const extended = extendRowDataWithDuplicateColumns(
        data,
        numDuplicateSets
      );
      if (cancelled.value) return;
      preparedData.value = extended;

      // --- Phase 3: Pre-compute column definitions ---
      phase.value = 'preparingColumns';
      getOrderColumnDefs(NUM_COLUMNS);
      getTableColumnIds(NUM_COLUMNS);
      if (cancelled.value) return;

      phase.value = 'ready';
    } catch (err) {
      if (!cancelled.value) {
        phase.value = 'error';
        errorMessage.value =
          err instanceof Error ? err.message : 'Failed to load data';
      }
    }
  })();
});

onBeforeUnmount(() => {
  cancelled.value = true;
});

// ---------- Grid & Adaptable configuration ----------
const adaptableOptions = ref<AdaptableOptions<ExtendedOrderData> | null>(null);
const gridOptions = ref<GridOptions<ExtendedOrderData> | null>(null);

/**
 * Builds AG Grid options and AdaptableTools options when the user clicks
 * "Load Grid". This is deferred (not built during the preparation pipeline)
 * so the loading screen stays responsive.
 */
function buildGridAndAdaptableOptions() {
  if (!preparedData.value) return;

  gridOptions.value = prepareGridOptions<ExtendedOrderData>({
    columnDefs: getOrderColumnDefs(NUM_COLUMNS),
    rowData: preparedData.value,
    defaultColDef: {
      minWidth: 130,
      filter: true,
      floatingFilter: true,
      enableValue: true,
      enablePivot: true,
      enableRowGroup: true,
    },
    autoGroupColumnDef: {
      minWidth: 200,
    },
    sideBar: true,
    statusBar: {
      statusPanels: [
        { statusPanel: 'agTotalRowCountComponent', align: 'left' },
        { statusPanel: 'agFilteredRowCountComponent' },
      ],
    },
  });

  adaptableOptions.value = {
    licenseKey: adaptableLicense?.trim?.(),
    primaryKey: 'id',
    userName: 'Test User',
    // Unique IDs per session so Adaptable starts from initialState every time
    adaptableId: `big-data-${Date.now()}`,
    adaptableStateKey: `big-data-${Date.now()}`,
    containerOptions: {
      agGridContainer: 'afl',
    },
    initialState: {
      Dashboard: {
        Tabs: [
          {
            Name: 'Default',
            Toolbars: ['Layout', 'ColumnFilter', 'GridFilter'],
          },
        ],
      },
      Layout: {
        CurrentLayout: 'Grouped',
        Layouts: [
          // Simple flat table with all columns
          {
            Name: 'Table',
            TableColumns: getTableColumnIds(NUM_COLUMNS),
          },
          // Grouped by product name with aggregations on every numeric column,
          // alternating between "only" (shows value when all rows agree) and "sum"
          {
            Name: 'Grouped',
            TableColumns: getTableColumnIds(NUM_COLUMNS),
            RowGroupedColumns: ['prodName'],
            TableAggregationColumns: getOrderColumnDefs(NUM_COLUMNS)
              .filter((col) => col.cellDataType === 'number' && !col.hide)
              .map((col, i) => ({
                ColumnId: col.field as string,
                AggFunc: i % 2 === 0 ? 'only' : 'sum',
              })),
          },
          // Pre-filtered: only rows where price > 100
          {
            Name: 'Filtered',
            TableColumns: getTableColumnIds(NUM_COLUMNS),
            ColumnFilters: [
              {
                ColumnId: 'price',
                Predicates:[
                  {
                    PredicateId: 'GreaterThan',
                    Inputs: [100],
                  }
                ]
              },
            ],
          },
        ],
      },
    },
  } as AdaptableOptions<ExtendedOrderData>;
}

function onLoadGrid() {
  buildGridAndAdaptableOptions();
  showGrid.value = true;
}

// Expose APIs globally for console debugging
const onAdaptableReady = ({ adaptableApi, agGridApi }: AdaptableReadyInfo) => {
  (globalThis as Record<string, unknown>).adaptableApi = adaptableApi;
  (globalThis as Record<string, unknown>).agGridApi = agGridApi;
};

// ---------- Loading-screen phase descriptions ----------
const columnCount = getTableColumnIds(NUM_COLUMNS).length;

const phases = [
  {
    id: 'fetching',
    label: (p: Phase) =>
      `Fetching data: ${fetchedRowCount.value != null ? fetchedRowCount.value.toLocaleString() : NUM_ROWS.toLocaleString()} rows${p === 'fetching' ? '...' : ''}`,
    completed: () => fetchedRowCount.value != null,
    active: () => phase.value === 'fetching',
  },
  {
    id: 'preparingData',
    label: () => 'Preparing data...',
    completed: () =>
      phase.value === 'preparingColumns' ||
      phase.value === 'ready' ||
      phase.value === 'error',
    active: () => phase.value === 'preparingData',
  },
  {
    id: 'preparingColumns',
    label: (p: Phase) =>
      `Preparing columns: ${columnCount.toLocaleString()} columns${p === 'preparingColumns' ? '...' : ''}`,
    completed: () => phase.value === 'ready' || phase.value === 'error',
    active: () => phase.value === 'preparingColumns',
  },
];

const allComplete = () => phase.value === 'ready';
const hasError = () => phase.value === 'error';
</script>

<template>
  <div
    v-if="showGrid && gridOptions && adaptableOptions"
    style="display: flex; flex-direction: column; height: calc(100vh - 20px)"
  >
    <AdaptableProvider
      :gridOptions="gridOptions"
      :adaptableOptions="
        adaptableOptions as AdaptableOptions<ExtendedOrderData>
      "
      :modules="agGridModules"
      @onAdaptableReady="onAdaptableReady"
    >
      <AdaptableUI />
      <AdaptableAgGridVue style="flex: 1" />
    </AdaptableProvider>
  </div>

  <div
    v-else
    style="
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 24px;
      padding: 24px;
    "
  >
    <div
      style="
        display: flex;
        flex-direction: column;
        gap: 8px;
        align-items: flex-start;
      "
    >
      <div
        v-for="p in phases"
        :key="p.id"
        :style="{
          fontSize: 16,
          color: p.active() || p.completed() ? '#000' : '#999',
        }"
      >
        {{ p.label(phase) }}
      </div>
    </div>
    <div v-if="hasError()" style="color: #c00; font-size: 14px">
      {{ errorMessage ?? 'Failed to load data' }}
    </div>
    <button
      type="button"
      class="load-grid-btn"
      :disabled="!allComplete()"
      @click="onLoadGrid"
    >
      Load Grid
    </button>
  </div>
</template>

<style scoped>
.load-grid-btn {
  padding: 10px 24px;
  font-size: 16px;
  font-weight: 500;
  color: #fff;
  background: #0066cc;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
.load-grid-btn:hover:not(:disabled) {
  background: #0052a3;
}
.load-grid-btn:active:not(:disabled) {
  background: #003d7a;
}
.load-grid-btn:disabled {
  background: #ccc;
  color: #666;
  cursor: not-allowed;
}
</style>
