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
import { ChevronDown } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import useDebouncedValue from "@/hooks/use-debounce"
import { columns } from "./columns"
import type { TableExercise } from "./types"

type ExerciseTableActionBarProps = {
  data: TableExercise[]
  selectedRows: RowSelectionState
  onSelectionChange: (selectedIds: RowSelectionState) => void
  onDeleteExercise: (exerciseId: string) => void
}

function ExerciseTableActionBar({
  table,
  muscleGroupOptions,
  selectedMuscleGroup,
  onChangeMuscleGroup,
  selectedType,
  onChangeType,
}: {
  table: ReactTableType<TableExercise>
  muscleGroupOptions: string[]
  selectedMuscleGroup: string
  onChangeMuscleGroup: (value: string) => void
  selectedType: string
  onChangeType: (value: string) => void
}) {
  const [searchValue, setSearchValue] = useState("")
  const debouncedSearchValue = useDebouncedValue(searchValue, 80)

  // Update table filter when debounced value changes
  useEffect(() => {
    table.getColumn("name")?.setFilterValue(debouncedSearchValue)
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
        <div className="z-10 hidden items-center gap-2 md:flex">
          <Label className="sr-only" htmlFor="muscle-group-filter">
            Muscle Group
          </Label>
          <Select
            onValueChange={(value) => {
              onChangeMuscleGroup(value)
              table.getColumn("muscleGroups")?.setFilterValue(value)
            }}
            value={selectedMuscleGroup}
          >
            <SelectTrigger className="w-44" id="muscle-group-filter">
              <SelectValue placeholder="All muscle groups" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All muscle groups</SelectItem>
              {muscleGroupOptions.map((mg) => (
                <SelectItem key={mg} value={mg}>
                  {mg}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="z-10 hidden items-center gap-2 md:flex">
          <Label className="sr-only" htmlFor="type-filter">
            Type
          </Label>
          <Select
            onValueChange={(value) => {
              onChangeType(value)
              table.getColumn("isCustom")?.setFilterValue(value)
            }}
            value={selectedType}
          >
            <SelectTrigger className="w-32" id="type-filter">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
              <SelectItem value="base">Base</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="z-10 flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="z-10 ml-auto" variant="outline">
              Columns <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    checked={column.getIsVisible()}
                    className="capitalize"
                    key={column.id}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id === "muscleGroups" ? "Muscle Groups" : column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export function ExerciseTable({
  data,
  selectedRows,
  onSelectionChange,
  onDeleteExercise,
}: ExerciseTableActionBarProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    isCustom: false,
  })
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 })
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>("all")
  const [selectedType, setSelectedType] = useState<string>("all")

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
    columns: columns(onDeleteExercise),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: handleSelectionChange,
    enableRowSelection: true,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection: selectedRows,
      pagination,
    },
  })

  const muscleGroupOptions = useMemo(() => {
    const set = new Set<string>()
    for (const ex of data) {
      for (const mg of ex.muscleGroups || []) {
        if (mg) set.add(mg)
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [data])

  return (
    <div className="isolate">
      <ExerciseTableActionBar
        muscleGroupOptions={muscleGroupOptions}
        onChangeMuscleGroup={setSelectedMuscleGroup}
        onChangeType={setSelectedType}
        selectedMuscleGroup={selectedMuscleGroup}
        selectedType={selectedType}
        table={table}
      />
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
        <div className="flex-1 text-muted-foreground text-sm">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
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
