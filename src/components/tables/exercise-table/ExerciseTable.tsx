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
import { CheckIcon, ChevronDown } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Tags,
  TagsContent,
  TagsEmpty,
  TagsGroup,
  TagsInput,
  TagsItem,
  TagsList,
  TagsValue,
} from "@/components/ui/kibo-ui/tags"
import { Label } from "@/components/ui/label"
import { PopoverTrigger } from "@/components/ui/popover"
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
  muscleGroupOptions,
  selectedMuscleGroups,
  onChangeMuscleGroups,
  selectedType,
  onChangeType,
}: {
  table: ReactTableType<TableExercise>
  muscleGroupOptions: string[]
  selectedMuscleGroups: string[]
  onChangeMuscleGroups: (value: string[]) => void
  selectedType: string
  onChangeType: (value: string) => void
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
        {/* <div className="z-10 hidden items-center gap-2 lg:flex">
          <Label className="sr-only" htmlFor="muscle-group-filter">
            Muscle Groups
          </Label>
          <Tags className="w-50 lg:w-70">
            <PopoverTrigger asChild>
              <Button
                className="h-auto w-full justify-between p-2"
                id="muscle-group-filter"
                variant="outline"
              >
                <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
                  {(() => {
                    if (selectedMuscleGroups.length === 0) {
                      return (
                        <span className="px-2 py-px text-muted-foreground">
                          Filter muscle groups...
                        </span>
                      )
                    }

                    if (selectedMuscleGroups.length <= 3) {
                      return selectedMuscleGroups.map((mg: string) => (
                        <TagsValue
                          className="max-w-30 shrink-0"
                          key={mg}
                          onRemove={() => {
                            const newSelected = selectedMuscleGroups.filter(
                              (item: string) => item !== mg
                            )
                            onChangeMuscleGroups(newSelected)
                            table
                              .getColumn("muscleGroups")
                              ?.setFilterValue(newSelected)
                          }}
                        >
                          <span className="truncate">{mg}</span>
                        </TagsValue>
                      ))
                    }

                    return (
                      <div className="flex min-w-0 items-center gap-1">
                        <TagsValue
                          className="max-w-30 shrink-0"
                          key={selectedMuscleGroups[0]}
                          onRemove={() => {
                            const newSelected = selectedMuscleGroups.filter(
                              (item: string) => item !== selectedMuscleGroups[0]
                            )
                            onChangeMuscleGroups(newSelected)
                            table
                              .getColumn("muscleGroups")
                              ?.setFilterValue(newSelected)
                          }}
                        >
                          <span className="truncate">
                            {selectedMuscleGroups[0]}
                          </span>
                        </TagsValue>
                        <span className="truncate px-2 py-1 text-muted-foreground text-xs">
                          +{selectedMuscleGroups.length - 1} more
                        </span>
                      </div>
                    )
                  })()}
                </div>
                <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <TagsContent>
              <TagsInput placeholder="" />
              <TagsList className="scrollbar scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                <TagsEmpty>No muscle groups found.</TagsEmpty>
                <TagsGroup>
                  {muscleGroupOptions.map((mg) => (
                    <TagsItem
                      key={mg}
                      onSelect={(value: string) => {
                        const isSelected = selectedMuscleGroups.includes(value)
                        const newSelected = isSelected
                          ? selectedMuscleGroups.filter(
                              (item: string) => item !== value
                            )
                          : [...selectedMuscleGroups, value]
                        onChangeMuscleGroups(newSelected)
                        table
                          .getColumn("muscleGroups")
                          ?.setFilterValue(newSelected)
                      }}
                      value={mg}
                    >
                      {mg}
                      {selectedMuscleGroups.includes(mg) && (
                        <CheckIcon
                          className="text-muted-foreground"
                          size={14}
                        />
                      )}
                    </TagsItem>
                  ))}
                </TagsGroup>
              </TagsList>
            </TagsContent>
          </Tags>
        </div> */}
        {/* <div className="z-10 hidden items-center gap-2 lg:flex">
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
        </div> */}
      </div>
      {/* <div className="z-10 flex items-center gap-2">
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
      </div> */}
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
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<string[]>([])
  const [selectedType, setSelectedType] = useState<string>("all")

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
        onChangeMuscleGroups={setSelectedMuscleGroups}
        onChangeType={setSelectedType}
        selectedMuscleGroups={selectedMuscleGroups}
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
