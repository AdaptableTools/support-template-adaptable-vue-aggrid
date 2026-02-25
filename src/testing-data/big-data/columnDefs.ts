/**
 * Column definitions for the big-data demo.
 *
 * Columns are split into two groups:
 *  - singleColumnDefs:  appear exactly once (text, date, and the hidden id).
 *  - duplicatableColumnDefsTemplate:  numeric / aggregatable columns that are
 *    cloned in sets (price, amount, invoiceNum, price_1, amount_1, …) to
 *    reach the desired total column count.
 *
 * The corresponding row-data duplication lives in ./rowData.ts
 */
import type { ColDef } from 'ag-grid-enterprise';
import type { OrderData } from './rowData';

/** Non-numeric columns + hidden id — each appears only once in the grid */
const singleColumnDefs: ColDef[] = [
  {
    field: 'id',
    cellDataType: 'number',
    hide: true,
    editable: false,
  },
  {
    field: 'prodName',
    headerName: 'Product Name',
    cellDataType: 'text',
    enableRowGroup: true,
  },
  {
    field: 'company',
    cellDataType: 'text',
    enableRowGroup: true,
  },
  // {
  //   field: 'currency',
  //   cellDataType: 'text',
  //   enableRowGroup: true,
  // },
  // {
  //   field: 'lastName',
  //   headerName: 'Customer Last Name',
  //   cellDataType: 'text',
  //   enableRowGroup: true,
  // },
  // {
  //   field: 'firstName',
  //   cellDataType: 'text',
  //   enableRowGroup: true,
  // },
  // {
  //   field: 'origin',
  //   headerName: 'Country of Origin',
  //   cellDataType: 'text',
  //   enableRowGroup: true,
  // },
  // {
  //   field: 'toAddress',
  //   headerName: 'Shipping Address',
  //   cellDataType: 'text',
  // },
  // {
  //   field: 'orderDate',
  //   cellDataType: 'date',
  // },
  // {
  //   field: 'dueDate',
  //   cellDataType: 'date',
  // },
  // {
  //   field: 'accountNum',
  //   headerName: 'Account Number',
  //   cellDataType: 'text',
  // },
  // {
  //   field: 'department',
  //   cellDataType: 'text',
  //   enableRowGroup: true,
  // },
];

/** Numeric columns to duplicate until NUM_COLUMNS is reached (aggregatable) */
const duplicatableColumnDefsTemplate: ColDef[] = [
  {
    field: 'price',
    headerName: 'Price',
    cellDataType: 'number',
  },
  {
    field: 'amount',
    headerName: 'Amount',
    cellDataType: 'number',
  },
  {
    field: 'invoiceNum',
    headerName: 'Invoice Number',
    cellDataType: 'number',
  },
];

const NUM_SINGLE_COLUMNS = singleColumnDefs.length;
const NUM_DUPLICATABLE_PER_SET = duplicatableColumnDefsTemplate.length;

/**
 * Number of complete duplicate sets needed to reach at least numColumns.
 * Used for row data extension.
 */
export function getNumDuplicateSets(numColumns: number): number {
  const remainder = numColumns - NUM_SINGLE_COLUMNS;
  if (remainder <= 0) {
    return 0;
  }
  return Math.ceil(remainder / NUM_DUPLICATABLE_PER_SET);
}

/**
 * Builds the full column-def array for the grid.
 *
 * Result = singleColumnDefs + N complete sets of duplicatableColumnDefsTemplate.
 * The first set keeps the original field names (price, amount, invoiceNum);
 * subsequent sets get a numeric suffix (price_1, amount_1, invoiceNum_1, …).
 *
 * Total may slightly exceed numColumns because only complete sets are added.
 */
export function getOrderColumnDefs(numColumns: number): ColDef[] {
  const numSets = getNumDuplicateSets(numColumns);
  const result: ColDef[] = [...singleColumnDefs];

  for (let i = 0; i < numSets; i++) {
    const suffix = i === 0 ? '' : ` ${i}`;
    for (const def of duplicatableColumnDefsTemplate) {
      const baseField = def.field as string;
      const fieldSuffix = i === 0 ? '' : `_${i}`;
      result.push({
        ...def,
        field: `${baseField}${fieldSuffix}`,
        headerName: `${def.headerName ?? baseField}${suffix}`,
      });
    }
  }

  return result;
}

/**
 * Returns exactly numColumns column IDs for Layout.TableColumns.
 */
export function getTableColumnIds(numColumns: number): string[] {
  const allColumnDefs = getOrderColumnDefs(numColumns);
  const allIds = allColumnDefs.map((def) => def.field as string).filter(Boolean);
  return allIds.slice(0, numColumns);
}
