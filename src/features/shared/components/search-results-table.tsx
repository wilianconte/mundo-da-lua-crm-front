"use client";

import { type ReactNode } from "react";

import { Button } from "@/components/ui/button";

type ResultsTableColumn<TSortKey extends string> = {
  label: string;
  sortKey?: TSortKey;
};

type SearchResultsTableProps<TRow, TSortKey extends string> = {
  columns: Array<ResultsTableColumn<TSortKey>>;
  sortBy: TSortKey;
  renderSortIcon: (column: TSortKey) => ReactNode;
  onToggleSort: (column: TSortKey) => void;
  rows: TRow[];
  isLoading: boolean;
  loadingText: string;
  emptyText: string;
  totalText: string;
  tableMinWidthClassName?: string;
  renderRow: (row: TRow) => ReactNode;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
};

export function SearchResultsTable<TRow, TSortKey extends string>({
  columns,
  sortBy,
  renderSortIcon,
  onToggleSort,
  rows,
  isLoading,
  loadingText,
  emptyText,
  totalText,
  tableMinWidthClassName = "min-w-[980px]",
  renderRow,
  canGoPrevious,
  canGoNext,
  onPreviousPage,
  onNextPage
}: SearchResultsTableProps<TRow, TSortKey>) {
  return (
    <>
      <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border)]">
        <table className={`w-full border-collapse text-sm ${tableMinWidthClassName}`}>
          <thead className="bg-[var(--color-surface-muted)] text-left text-[var(--color-muted-foreground)]">
            <tr>
              {columns.map((column, index) => (
                <th className="px-4 py-3 font-semibold" key={`${column.label}-${index}`}>
                  {column.sortKey ? (
                    <button
                      className="inline-flex items-center gap-1 text-left transition hover:text-[var(--color-foreground)]"
                      onClick={() => onToggleSort(column.sortKey as TSortKey)}
                      type="button"
                    >
                      {column.label}
                      {sortBy === column.sortKey ? renderSortIcon(column.sortKey) : null}
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr className="border-t border-[var(--color-border)]">
                <td className="px-4 py-6 text-center text-[var(--color-muted-foreground)]" colSpan={columns.length}>
                  {loadingText}
                </td>
              </tr>
            ) : rows.length ? (
              rows.map((row) => renderRow(row))
            ) : (
              <tr className="border-t border-[var(--color-border)]">
                <td className="px-4 py-6 text-center text-[var(--color-muted-foreground)]" colSpan={columns.length}>
                  {emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--color-muted-foreground)]">{totalText}</p>
        <div className="flex items-center gap-2">
          <Button disabled={!canGoPrevious} onClick={onPreviousPage} size="sm" variant="outline">
            Anterior
          </Button>
          <Button disabled={!canGoNext} onClick={onNextPage} size="sm" variant="outline">
            Proxima
          </Button>
        </div>
      </div>
    </>
  );
}
