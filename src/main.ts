import { createApp } from "vue";
import App from "./App.vue";
import "@ag-grid-community/styles/ag-grid.css";
import "@ag-grid-community/styles/ag-theme-alpine.css";
import "@adaptabletools/adaptable-vue3-aggrid/base.css";
import "@adaptabletools/adaptable-vue3-aggrid/themes/light.css";
import "@adaptabletools/adaptable-vue3-aggrid/themes/dark.css";
import { LicenseManager } from "@ag-grid-enterprise/core";
import { agGridLicense } from "./config";

LicenseManager.setLicenseKey(agGridLicense);

createApp(App).mount("#app");
