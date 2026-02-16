import { createApp } from 'vue';
import App from './App.vue';
import '@adaptabletools/adaptable-vue3-aggrid/index.css';
import '@adaptabletools/adaptable-vue3-aggrid/themes/dark.css';
import { LicenseManager } from 'ag-grid-enterprise';
import { agGridLicense } from './config';

LicenseManager.setLicenseKey(agGridLicense);

createApp(App).mount('#app');
