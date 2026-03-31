"use client";

import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowDownUp,
  ArrowLeftToLine,
  ArrowRightToLine,
  Ban,
  Check,
  FolderTree,
  EyeOff,
  ListOrdered,
  Sparkles
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";

import { Button } from "@/components/ui/button";

type ResultsTableColumn<TSortKey extends string> = {
  id?: string;
  label: ReactNode;
  sortKey?: TSortKey;
  draggable?: boolean;
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
  compact?: boolean;
  onReorderColumns?: (sourceColumnId: string, targetColumnId: string) => void;
};

type SortableHeaderCellProps<TSortKey extends string> = {
  column: ResultsTableColumn<TSortKey>;
  index: number;
  isActive: boolean;
  sortBy: TSortKey;
  renderSortIcon: (column: TSortKey) => ReactNode;
  onToggleSort: (column: TSortKey) => void;
  onOpenContextMenu: (event: ReactMouseEvent<HTMLTableCellElement>, index: number, label: ReactNode) => void;
  compact: boolean;
};

function SortableHeaderCell<TSortKey extends string>({
  column,
  index,
  isActive,
  sortBy,
  renderSortIcon,
  onToggleSort,
  onOpenContextMenu,
  compact
}: SortableHeaderCellProps<TSortKey>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: column.id ?? `fallback-${index}`,
    disabled: column.draggable === false
  });

  const headerCellClassName = compact ? "px-3 py-2.5 font-semibold" : "px-4 py-3 font-semibold";

  return (
    <th
      {...attributes}
      {...listeners}
      className={`${headerCellClassName} relative cursor-grab select-none active:cursor-grabbing ${
        isDragging || isActive ? "opacity-40" : ""
      }`}
      onContextMenu={(event) => onOpenContextMenu(event, index, column.label)}
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition
      }}
    >
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
  );
}

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
  onNextPage,
  compact = false,
  onReorderColumns
}: SearchResultsTableProps<TRow, TSortKey>) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuState, setMenuState] = useState<{
    top: number;
    left: number;
    right: number;
    align: "left" | "right";
    columnLabel: string;
  } | null>(null);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);

  const contextMenuItems = useMemo(
    () => [
      { label: "Classificar", icon: ArrowDownUp, highlighted: true },
      { label: "Ordenar coluna inteira", icon: ListOrdered },
      { label: "Remover ordenacao", icon: Ban },
      { label: "Grupo", icon: FolderTree, separatorBefore: true },
      { label: "Mover para o inicio", icon: ArrowLeftToLine, separatorBefore: true },
      { label: "Mover para o final", icon: ArrowRightToLine },
      { label: "Ocultar coluna", icon: EyeOff },
      { label: "Configurar preenchimento com IA", icon: Sparkles, separatorBefore: true }
    ],
    []
  );

  useEffect(() => {
    function handleClickOutside(event: globalThis.MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuState(null);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuState(null);
      }
    }

    if (menuState) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuState]);

  const headerCellClassName = compact ? "px-3 py-2.5 font-semibold" : "px-4 py-3 font-semibold";
  const feedbackCellClassName = compact
    ? "px-3 py-5 text-center text-[var(--color-muted-foreground)]"
    : "px-4 py-6 text-center text-[var(--color-muted-foreground)]";
  const sortableColumns = useMemo(
    () => columns.filter((column) => column.id && column.draggable !== false),
    [columns]
  );
  const sortableColumnIds = useMemo(
    () => sortableColumns.map((column, index) => column.id ?? `fallback-${index}`),
    [sortableColumns]
  );
  const activeColumn = useMemo(
    () => sortableColumns.find((column) => column.id === activeColumnId) ?? null,
    [activeColumnId, sortableColumns]
  );
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveColumnId(null);
    if (!over || !onReorderColumns) return;
    if (active.id === over.id) return;
    onReorderColumns(String(active.id), String(over.id));
  }

  function openContextMenu(event: React.MouseEvent<HTMLTableCellElement>, index: number, label: ReactNode) {
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const isLastColumn = index === columns.length - 1;
    setMenuState({
      top: rect.bottom + 4,
      left: rect.left,
      right: window.innerWidth - rect.right,
      align: isLastColumn ? "right" : "left",
      columnLabel: typeof label === "string" ? label : "Coluna"
    });
  }

  return (
    <>
      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        onDragStart={({ active }) => setActiveColumnId(String(active.id))}
        sensors={sensors}
      >
        <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border)]">
          <table className={`w-full border-collapse text-sm ${tableMinWidthClassName}`}>
            <thead className="bg-[var(--color-surface-muted)] text-left text-[var(--color-muted-foreground)]">
              <tr>
                <SortableContext items={sortableColumnIds} strategy={horizontalListSortingStrategy}>
                  {columns.map((column, index) => {
                    const canDragColumn = Boolean(onReorderColumns && column.id && column.draggable !== false);
                    const currentId = column.id ?? `fallback-${index}`;
                    if (canDragColumn) {
                      return (
                        <SortableHeaderCell
                          column={column}
                          compact={compact}
                          index={index}
                          isActive={activeColumnId === currentId}
                          key={currentId}
                          onOpenContextMenu={openContextMenu}
                          onToggleSort={onToggleSort}
                          renderSortIcon={renderSortIcon}
                          sortBy={sortBy}
                        />
                      );
                    }

                    return (
                      <th
                        className={headerCellClassName}
                        key={currentId}
                        onContextMenu={(event) => openContextMenu(event, index, column.label)}
                      >
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
                    );
                  })}
                </SortableContext>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr className="border-t border-[var(--color-border)]">
                  <td className={feedbackCellClassName} colSpan={columns.length}>
                    {loadingText}
                  </td>
                </tr>
              ) : rows.length ? (
                rows.map((row) => renderRow(row))
              ) : (
                <tr className="border-t border-[var(--color-border)]">
                  <td className={feedbackCellClassName} colSpan={columns.length}>
                    {emptyText}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <DragOverlay>
          {activeColumn ? (
            <div className="px-3 py-2 text-sm font-semibold text-[var(--color-foreground)]">
              {activeColumn.label}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

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

      {menuState ? (
        <div
          className="fixed z-[70] min-w-[250px] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1.5 shadow-2xl"
          ref={menuRef}
          style={
            menuState.align === "right"
              ? { right: menuState.right, top: menuState.top }
              : { left: menuState.left, top: menuState.top }
          }
        >
          <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-muted-foreground)]">
            {menuState.columnLabel}
          </p>
          {contextMenuItems.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.label}>
                {item.separatorBefore ? <div className="my-1 h-px bg-[var(--color-border)]" /> : null}
                <button
                  className="flex w-full items-center justify-between rounded-[var(--radius-sm)] px-2 py-2 text-left text-sm text-[var(--color-foreground)] transition hover:bg-[var(--color-surface-muted)]"
                  onClick={() => setMenuState(null)}
                  type="button"
                >
                  <span className="inline-flex items-center gap-2">
                    <Icon className="size-4 text-[var(--color-muted-foreground)]" />
                    {item.label}
                  </span>
                  {item.highlighted ? <Check className="size-4 text-[var(--color-foreground)]" /> : null}
                </button>
              </div>
            );
          })}
        </div>
      ) : null}
    </>
  );
}
