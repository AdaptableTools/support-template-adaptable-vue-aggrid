import type { GridOptions } from 'ag-grid-community';
import { themeQuartz } from 'ag-grid-enterprise';

export function prepareGridOptions<T = unknown>(gridOptions: GridOptions<T>): GridOptions<T> {
  return {
    ...gridOptions,
    ensureDomOrder: true,
    suppressColumnVirtualisation: true,
    theme: themeQuartz,
    animateRows: false,
  };
}
