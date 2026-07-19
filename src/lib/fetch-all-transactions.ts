import { apiFetch } from "@/lib/api";
import type { Pagination, Transaction } from "@/types/api";

/** Fetch every page matching the current filter params (max 100 per request). */
export async function fetchAllFilteredTransactions(
  endpoint: string,
  filterParams: URLSearchParams,
): Promise<Transaction[]> {
  const rows: Transaction[] = [];
  let page = 1;
  let lastPage = 1;

  do {
    const params = new URLSearchParams(filterParams);
    params.set("page", String(page));
    params.set("perPage", "100");

    const data = await apiFetch<{
      transactions: Transaction[];
      pagination: Pagination;
    }>(`${endpoint}?${params.toString()}`);

    rows.push(...data.transactions);
    lastPage = data.pagination.lastPage;
    page += 1;
  } while (page <= lastPage);

  return rows;
}
