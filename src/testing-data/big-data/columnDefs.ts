import type { ColDef } from 'ag-grid-enterprise';
import type { OrderData } from './rowData';

/** Single columns - appear once: id, prodName, company */
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
];

/** Column definitions to duplicate until NUM_COLUMNS is reached */
const duplicatableColumnDefsTemplate: ColDef[] = [
  {
    field: 'price',
    cellDataType: 'number',
  },
  {
    field: 'amount',
    cellDataType: 'number',
  },
  {
    field: 'currency',
    cellDataType: 'text',
    enableRowGroup: true,
  },
  {
    field: 'lastName',
    headerName: 'Customer Last Name',
    cellDataType: 'text',
    enableRowGroup: true,
  },
  {
    field: 'firstName',
    cellDataType: 'text',
    enableRowGroup: true,
  },
  {
    field: 'origin',
    headerName: 'Country of Origin',
    cellDataType: 'text',
    enableRowGroup: true,
  },
  {
    field: 'toAddress',
    headerName: 'Shipping Address',
    cellDataType: 'text',
  },
  {
    field: 'orderDate',
    cellDataType: 'date',
  },
  {
    field: 'dueDate',
    cellDataType: 'date',
  },
  {
    field: 'invoiceNum',
    headerName: 'Invoice Number',
    cellDataType: 'number',
  },
  {
    field: 'accountNum',
    headerName: 'Account Number',
    cellDataType: 'text',
  },
  {
    field: 'department',
    cellDataType: 'text',
    enableRowGroup: true,
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
 * Returns column definitions for big data testing.
 * Single columns (id, prodName, company) appear once.
 * Other columns are duplicated in complete sets until we have enough.
 * May exceed numColumns (complete sets only).
 *
 * @param numColumns - Target total number of columns to generate
 */
export function getOrderColumnDefs(numColumns: number): ColDef[] {
  const numSets = getNumDuplicateSets(numColumns);
  const result: ColDef[] = [...singleColumnDefs];

  for (let i = 0; i < numSets; i++) {
    const suffix = i === 0 ? '' : `_${i}`;
    for (const def of duplicatableColumnDefsTemplate) {
      const baseField = def.field as string;
      const field = `${baseField}${suffix}`;
      result.push({
        ...def,
        field,
        headerName: def.headerName ?? baseField,
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
