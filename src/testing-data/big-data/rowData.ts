const API_BASE = 'https://docs.adaptabletools.com/.netlify/functions/json-server';
const apiPath = `${API_BASE}/orders100k`;

/** Fields to duplicate when extending row data (excludes id, prodName, company - those are single) */
export const baseDataFieldNames = [
  'price',
  'amount',
  'currency',
  'lastName',
  'firstName',
  'origin',
  'toAddress',
  'orderDate',
  'dueDate',
  'invoiceNum',
  'accountNum',
  'department',
] as const;

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
  orderDate: string; // ISO date string
  dueDate: string; // ISO date string
  invoiceNum: string;
  accountNum: string;
  department: string;
}

export type ExtendedOrderData = OrderData & Record<string, unknown>;

/**
 * Extends row data with duplicated column values for big data column testing.
 * For numColumns=2, adds prodName_1, company_1, etc. (copying from prodName, company, ...).
 * For numColumns=3, adds _1 and _2 suffixed fields, etc.
 */
export function extendRowDataWithDuplicateColumns<T extends OrderData>(
  data: T[],
  numColumns: number
): ExtendedOrderData[] {
  if (numColumns <= 1) {
    return data as ExtendedOrderData[];
  }

  return data.map((row) => {
    const extended: ExtendedOrderData = { ...row } as ExtendedOrderData;
    for (let i = 1; i < numColumns; i++) {
      const suffix = `_${i}`;
      for (const field of baseDataFieldNames) {
        const value = row[field];
        extended[`${field}${suffix}`] = value;
      }
    }
    return extended;
  });
}

export async function fetchOrdersData(maxRows: number = 100_000): Promise<OrderData[]> {
  // Ensure maxRows does not exceed 30,000
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
  // Only return up to totalRows
  return allData.slice(0, totalRows);
}
