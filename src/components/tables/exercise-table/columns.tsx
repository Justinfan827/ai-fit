import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { TableExercise } from "./types"

export const columns: ColumnDef<TableExercise>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        aria-label="Select all"
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label="Select row"
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
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
    accessorKey: "muscleGroups",
    header: ({ column }) => {
      return (
        <Button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          variant="ghost"
        >
          Muscle Groups
          <ArrowUpDown />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("muscleGroups")}</div>
    ),
    filterFn: (row, id, value) => {
      if (!value || value === "all") return true
      const v = row.getValue(id) as string
      return v === value
    },
  },
  {
    //  invisible column, just needs to present for filtering to work.
    id: "isCustom",
    header: "Custom",
    enableHiding: false,
    cell: () => null,
    filterFn: (row, id, value) => {
      if (!value || value === "all") return true
      const v = row.getValue(id) as boolean
      return v === value
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const exercise = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="h-8 w-8 p-0" variant="ghost">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(exercise.id)}
            >
              Remove Exercise
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View exercise details</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
