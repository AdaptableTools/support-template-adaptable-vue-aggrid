/**
 * Row-data fetching and extension for the big-data demo.
 *
 * Data is fetched from a paginated REST API, then numeric fields are
 * duplicated across each row to match the duplicated column definitions
 * produced by ./columnDefs.ts.
 */

const API_BASE = 'https://docs.adaptabletools.com/.netlify/functions/json-server';
const apiPath = `${API_BASE}/orders100k`;

/**
 * Only the numeric (aggregatable) fields are duplicated.
 * Must stay in sync with duplicatableColumnDefsTemplate in ./columnDefs.ts.
 */
export const baseDataFieldNames = ['price', 'amount', 'invoiceNum'] as const;

export interface OrderData {
  id: string;
  prodName: string;
  lastName: string;
  firstName: string;
  company: string;
  origin: string;
  toAddress: string;
  price: number;
  currency: string;
  amount: number;
  orderDate: string;
  dueDate: string;
  invoiceNum: string;
  accountNum: string;
  department: string;
}

export type ExtendedOrderData = OrderData & Record<string, unknown>;

/**
 * Clones numeric field values into suffixed copies on each row.
 *
 * Given numDuplicateSets=3, each row gains:
 *   price, amount, invoiceNum          (original — set 0, no suffix)
 *   price_1, amount_1, invoiceNum_1    (set 1)
 *   price_2, amount_2, invoiceNum_2    (set 2)
 *
 * The values are copied from the original fields so aggregations work.
 */
export function extendRowDataWithDuplicateColumns<T extends OrderData>(
  data: T[],
  numDuplicateSets: number
): ExtendedOrderData[] {
  if (numDuplicateSets <= 1) {
    return data as ExtendedOrderData[];
  }

  return data.map((row) => {
    const extended: ExtendedOrderData = { ...row } as ExtendedOrderData;
    for (let i = 1; i < numDuplicateSets; i++) {
      const suffix = `_${i}`;
      for (const field of baseDataFieldNames) {
        extended[`${field}${suffix}`] = row[field];
      }
    }
    return extended;
  });
}

/**
 * Fetches order rows from the remote API (paginated, 10k per page).
 * Server caps at 30k rows regardless of maxRows.
 */
export async function fetchOrdersData(maxRows: number = 100_000): Promise<OrderData[]> {
  const totalRows = Math.min(maxRows, 30_000);
  let page = 1;
  const limit = 10_000;
  const totalPages = Math.ceil(totalRows / limit);

  const promises = [];
  while (page <= totalPages) {
    const path = `${apiPath}?_page=${page}&_limit=${limit}`;
    promises.push(fetch(path).then((resp) => resp.json()));
    page += 1;
  }

  const allData = (await Promise.all(promises)).flat();
  return allData.slice(0, totalRows);
}
