"use client";

import { Button } from "@/components/ui/primitives";
import type { Pagination } from "@/types/api";

export function PaginationBar({
  pagination,
  onPageChange,
}: {
  pagination: Pagination | null;
  onPageChange: (page: number) => void;
}) {
  if (!pagination || pagination.lastPage <= 1) {
    return null;
  }

  const { currentPage, lastPage, total, perPage } = pagination;
  const from = total === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const to = Math.min(currentPage * perPage, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
      <p className="text-xs text-slate-500">
        Showing {from}–{to} of {total} · Page {currentPage} of {lastPage}
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          className="px-3 py-1.5 text-xs"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Prev
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="px-3 py-1.5 text-xs"
          disabled={currentPage >= lastPage}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
