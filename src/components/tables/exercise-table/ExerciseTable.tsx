import {
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type Table as ReactTableType,
  type RowSelectionState,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import useDebouncedValue from "@/hooks/use-debounce"
import type { CategoryWithValues } from "@/lib/types/categories"
import { columns } from "./columns"
import { fuzzyFilter } from "./fuzzy-search"
import type { TableExercise } from "./types"

type ExerciseTableActionBarProps = {
  data: TableExercise[]
  categories: CategoryWithValues[]
  selectedRows: RowSelectionState
  onSelectionChange: (selectedIds: RowSelectionState) => void
  onDeleteExercise: (exerciseId: string) => void
  onUpdateExercise: (exercise: TableExercise) => void
}

function ExerciseTableActionBar({
  table,
}: {
  table: ReactTableType<TableExercise>
}) {
  const [searchValue, setSearchValue] = useState("")
  const debouncedSearchValue = useDebouncedValue(searchValue, 80)

  // Update global filter when debounced value changes
  useEffect(() => {
    table.setGlobalFilter(debouncedSearchValue)
  }, [debouncedSearchValue, table])
  return (
    <div className="sticky top-0 isolate z-10 flex items-center justify-between gap-3 bg-background pt-2 pb-6">
      <div className="-mx-4 -mt-4 absolute inset-0 bg-background" />
      <div className="z-10 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Label className="sr-only" htmlFor="exercise-search">
            Search exercises
          </Label>
          <Input
            className="w-64 lg:w-96"
            id="exercise-search"
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search exercises..."
            value={searchValue}
          />
        </div>
      </div>
    </div>
  )
}

export function ExerciseTable({
  data,
  categories,
  selectedRows,
  onSelectionChange,
  onDeleteExercise,
  onUpdateExercise,
}: ExerciseTableActionBarProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState<string>("")
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    isCustom: false,
    __fuzzyScore__: false, // Hide the fuzzy score column
  })
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 })

  // Auto-sort by fuzzy score when global filter is active
  useEffect(() => {
    if (globalFilter?.trim()) {
      // When searching, sort by fuzzy score (highest first)
      setSorting([{ id: "__fuzzyScore__", desc: true }])
    } else {
      // When not searching, clear the fuzzy score sorting
      setSorting((prev) => prev.filter((sort) => sort.id !== "__fuzzyScore__"))
    }
  }, [globalFilter])

  const handleSelectionChange = (updaterOrValue: unknown) => {
    if (typeof updaterOrValue === "function") {
      const updater = updaterOrValue as (
        old: RowSelectionState
      ) => RowSelectionState
      onSelectionChange(updater(selectedRows))
    } else {
      onSelectionChange(updaterOrValue as RowSelectionState)
    }
  }
  const table = useReactTable({
    data,
    columns: columns({ onDeleteExercise, categories, onUpdateExercise }),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: handleSelectionChange,
    enableRowSelection: true,
    globalFilterFn: fuzzyFilter,
    filterFns: {
      fuzzy: fuzzyFilter,
    },

    getRowId: (row) => row.id,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
      rowSelection: selectedRows,
      pagination,
    },
  })

  return (
    <div className="isolate">
      <ExerciseTableActionBar table={table} />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  data-state={row.getIsSelected() && "selected"}
                  key={row.id}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  className="h-24 text-center"
                  colSpan={table.getAllLeafColumns().length}
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        {/* TODO: add row selection count */}
        {/* <div className="flex-1 text-muted-foreground text-sm">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div> */}
        <div className="space-x-2">
          <Button
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
            size="sm"
            variant="outline"
          >
            Previous
          </Button>
          <Button
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
            size="sm"
            variant="outline"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
