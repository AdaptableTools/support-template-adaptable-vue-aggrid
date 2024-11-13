<script setup lang="ts">
import {
  AdaptableProvider,
  AdaptableAgGridVue,
  AdaptableUI,
  AdaptableStateFunctionConfig,
} from "@adaptabletools/adaptable-vue3-aggrid";
import type {
  AdaptableApi,
  AdaptableOptions,
} from "@adaptabletools/adaptable-vue-aggrid";
import type { WebFramework } from "./rowData";
import type { GridOptions } from "@ag-grid-community/core";
import { adaptableLicense } from "./config";
import { rowData } from "./rowData";
import { agGridModules } from "./agGridModules";
import { defaultColDef, columnDefs } from "./columnDefs";

const CONFIG_REVISION = 1;

const gridOptions: GridOptions<WebFramework> = {
  defaultColDef,
  columnDefs,
  rowData,
  sideBar: true,
  statusBar: {
    statusPanels: [
      { statusPanel: "agTotalRowCountComponent", align: "left" },
      { statusPanel: "agFilteredRowCountComponent" },
      {
        key: "Center Panel",
        statusPanel: "AdaptableStatusPanel",
        align: "center",
      },
    ],
  },

  suppressMenuHide: true,
  enableRangeSelection: true,
  enableCharts: true,
};

const adaptableOptions: AdaptableOptions = {
  licenseKey: adaptableLicense?.trim?.(),
  primaryKey: "id",
  userName: "Test User",
  adaptableId: "Adaptable Vue Demo",
  adaptableStateKey: "adaptable_vue_demo",
  stateOptions: {
    persistState: (state, adaptableStateFunctionConfig) => {
      localStorage.setItem(
        adaptableStateFunctionConfig.adaptableStateKey,
        JSON.stringify(state)
      );
      return Promise.resolve(true);
    },
    loadState: (config: AdaptableStateFunctionConfig) => {
      return new Promise((resolve) => {
        let state = {};
        try {
          state =
            JSON.parse(localStorage.getItem(config.adaptableStateKey)) || {};
        } catch (err) {
          console.log("Error loading state", err);
        }
        resolve(state);
      });
    },
  },
  predefinedConfig: {
    Dashboard: {
      Revision: CONFIG_REVISION,
      Tabs: [
        {
          Name: "Welcome",
          Toolbars: ["Layout"],
        },
      ],
    },
    StatusBar: {
      Revision: CONFIG_REVISION,
      StatusBars: [
        {
          Key: "Center Panel",
          StatusBarPanels: ["Theme"],
        },
      ],
    },
    Layout: {
      Revision: CONFIG_REVISION,
      CurrentLayout: "Basic",
      Layouts: [
        {
          Name: "Basic",
          Columns: [
            "name",
            "language",
            "github_stars",
            "license",
            "week_issue_change",
            "created_at",
            "has_wiki",
            "updated_at",
            "pushed_at",
            "github_watchers",
            "description",
            "open_issues_count",
            "closed_issues_count",
            "open_pr_count",
            "closed_pr_count",
          ],
        },
      ],
    },
  },
};
</script>

<template>
  <AdaptableProvider
    :gridOptions="gridOptions"
    :adaptableOptions="adaptableOptions"
    :modules="agGridModules"
    @onAdaptableReady="() => console.log('Adaptable Ready')"
  >
    <div
      style="display: flex; flex-direction: column; height: calc(100vh - 20px)"
    >
      <AdaptableUI />
      <AdaptableAgGridVue style="flex: 1" class="ag-theme-alpine" />
    </div>
  </AdaptableProvider>
</template>

<style scoped></style>
