"use client"

import { Plus } from "lucide-react"
import * as React from "react"
import { DataGridColumnHeader } from "@/components/data-grid/data-grid-column-header"
import { DataGridContextMenu } from "@/components/data-grid/data-grid-context-menu"
import { DataGridPasteDialog } from "@/components/data-grid/data-grid-paste-dialog"
import { DataGridRow } from "@/components/data-grid/data-grid-row"
import { DataGridSearch } from "@/components/data-grid/data-grid-search"
import type { useDataGrid } from "@/hooks/use-data-grid"
import { flexRender, getCommonPinningStyles } from "@/lib/data-grid"
import { cn } from "@/lib/utils"
import type { Direction } from "@/types/data-grid"

interface DataGridProps<TData>
  extends Omit<ReturnType<typeof useDataGrid<TData>>, "dir">,
    Omit<React.ComponentProps<"div">, "contextMenu"> {
  dir?: Direction
  height?: number
  stretchColumns?: boolean
}

export function DataGrid<TData>({
  dataGridRef,
  headerRef,
  rowMapRef,
  footerRef,
  dir = "ltr",
  table,
  tableMeta,
  rowVirtualizer,
  columns,
  searchState,
  columnSizeVars,
  cellSelectionMap,
  focusedCell,
  editingCell,
  rowHeight,
  contextMenu,
  pasteDialog,
  onRowAdd,
  height = 600,
  stretchColumns = false,
  className,
  ...props
}: DataGridProps<TData>) {
  const rows = table.getRowModel().rows
  const readOnly = tableMeta?.readOnly ?? false
  const columnVisibility = table.getState().columnVisibility
  const columnPinning = table.getState().columnPinning

  const onGridContextMenu = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.preventDefault()
    },
    []
  )

  const onAddRowKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!onRowAdd) return

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault()
        onRowAdd()
      }
    },
    [onRowAdd]
  )

  return (
    <div
      data-slot="grid-wrapper"
      dir={dir}
      {...props}
      className={cn("relative flex w-full flex-col", className)}
    >
      {searchState && <DataGridSearch {...searchState} />}
      <DataGridContextMenu
        columns={columns}
        contextMenu={contextMenu}
        tableMeta={tableMeta}
      />
      <DataGridPasteDialog pasteDialog={pasteDialog} tableMeta={tableMeta} />
      <div
        aria-colcount={columns.length}
        aria-label="Data grid"
        aria-rowcount={rows.length + (onRowAdd ? 1 : 0)}
        className="relative grid select-none overflow-auto rounded-md border focus:outline-none"
        data-slot="grid"
        onContextMenu={onGridContextMenu}
        ref={dataGridRef}
        role="grid"
        style={{
          ...columnSizeVars,
          maxHeight: `${height}px`,
        }}
        tabIndex={0}
      >
        <div
          className="sticky top-0 z-10 grid border-b bg-background"
          data-slot="grid-header"
          ref={headerRef}
          role="rowgroup"
        >
          {table.getHeaderGroups().map((headerGroup, rowIndex) => (
            <div
              aria-rowindex={rowIndex + 1}
              className="flex w-full"
              data-slot="grid-header-row"
              key={headerGroup.id}
              role="row"
              tabIndex={-1}
            >
              {headerGroup.headers.map((header, colIndex) => {
                const sorting = table.getState().sorting
                const currentSort = sorting.find(
                  (sort) => sort.id === header.column.id
                )
                const isSortable = header.column.getCanSort()

                return (
                  <div
                    aria-colindex={colIndex + 1}
                    aria-sort={
                      currentSort?.desc === false
                        ? "ascending"
                        : currentSort?.desc === true
                          ? "descending"
                          : isSortable
                            ? "none"
                            : undefined
                    }
                    className={cn("relative", {
                      grow: stretchColumns && header.column.id !== "select",
                      "border-e": header.column.id !== "select",
                    })}
                    data-slot="grid-header-cell"
                    key={header.id}
                    role="columnheader"
                    style={{
                      ...getCommonPinningStyles({ column: header.column, dir }),
                      width: `calc(var(--header-${header.id}-size) * 1px)`,
                    }}
                    tabIndex={-1}
                  >
                    {header.isPlaceholder ? null : typeof header.column
                        .columnDef.header === "function" ? (
                      <div className="size-full px-3 py-1.5">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </div>
                    ) : (
                      <DataGridColumnHeader header={header} table={table} />
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
        <div
          className="relative grid"
          data-slot="grid-body"
          role="rowgroup"
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            contain: "strict",
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualItem) => {
            const row = rows[virtualItem.index]
            if (!row) return null

            const cellSelectionKeys =
              cellSelectionMap?.get(virtualItem.index) ?? new Set<string>()

            return (
              <DataGridRow
                cellSelectionKeys={cellSelectionKeys}
                columnPinning={columnPinning}
                columnVisibility={columnVisibility}
                dir={dir}
                editingCell={editingCell}
                focusedCell={focusedCell}
                key={row.id}
                readOnly={readOnly}
                row={row}
                rowHeight={rowHeight}
                rowMapRef={rowMapRef}
                rowVirtualizer={rowVirtualizer}
                stretchColumns={stretchColumns}
                tableMeta={tableMeta}
                virtualItem={virtualItem}
              />
            )
          })}
        </div>
        {onRowAdd && (
          <div
            className="sticky bottom-0 z-10 grid border-t bg-background"
            data-slot="grid-footer"
            ref={footerRef}
            role="rowgroup"
          >
            <div
              aria-rowindex={rows.length + 2}
              className="flex w-full"
              data-slot="grid-add-row"
              role="row"
              tabIndex={-1}
            >
              <div
                className="relative flex h-9 grow items-center bg-muted/30 transition-colors hover:bg-muted/50 focus:bg-muted/50 focus:outline-none"
                onClick={onRowAdd}
                onKeyDown={onAddRowKeyDown}
                role="gridcell"
                style={{
                  width: table.getTotalSize(),
                  minWidth: table.getTotalSize(),
                }}
                tabIndex={0}
              >
                <div className="sticky start-0 flex items-center gap-2 px-3 text-muted-foreground">
                  <Plus className="size-3.5" />
                  <span className="text-sm">Add row</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
