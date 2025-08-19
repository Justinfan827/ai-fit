import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ExerciseActionDropdown } from "./ExerciseActionDropdown"
import { getFuzzyScore } from "./fuzzy-search"
import type { TableExercise } from "./types"

export const columns = (
  onDeleteExercise: (exerciseId: string) => void
): ColumnDef<TableExercise>[] => [
  // TODO: support selection
  // {
  //   id: "select",
  //   header: ({ table }) => (
  //     <Checkbox
  //       aria-label="Select all"
  //       checked={
  //         table.getIsAllPageRowsSelected() ||
  //         (table.getIsSomePageRowsSelected() && "indeterminate")
  //       }
  //       onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
  //     />
  //   ),
  //   cell: ({ row }) => (
  //     <Checkbox
  //       aria-label="Select row"
  //       checked={row.getIsSelected()}
  //       onCheckedChange={(value) => row.toggleSelected(!!value)}
  //     />
  //   ),
  //   enableSorting: false,
  //   enableHiding: false,
  // },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          variant="ghost"
        >
          Name
          <ArrowUpDown />
        </Button>
      )
    },
    cell: ({ row }) => {
      return (
        <div className="capitalize">
          <div>{row.getValue("name")}</div>
          {row.original.isCustom && (
            <div className="inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-muted-foreground text-xs uppercase tracking-wider transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2">
              Custom
            </div>
          )}
        </div>
      )
    },
    enableHiding: false,
  },
  {
    //  invisible column, just needs to present for filtering to work.
    accessorKey: "isCustom",
    id: "isCustom",
    header: "Custom",
    enableHiding: false,
    cell: () => null,
    filterFn: (row, id, value) => {
      if (!value || value === "all") return true
      const isCustom = row.getValue(id) as boolean
      if (value === "custom") return isCustom === true
      if (value === "base") return isCustom === false
      return true
    },
  },
  {
    id: "__fuzzyScore__",
    // TODO: revist how to sort without using global map
    accessorFn: (row) => getFuzzyScore(row.id),
    enableHiding: false,
    enableSorting: true,
    header: () => null,
    cell: () => null,
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      return (
        <ExerciseActionDropdown
          exercise={row.original}
          onDelete={onDeleteExercise}
        />
      )
    },
  },
]
