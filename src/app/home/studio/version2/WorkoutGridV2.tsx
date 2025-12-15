"use client"

import type { ColumnDef } from "@tanstack/react-table"
import * as React from "react"
import { DataGrid } from "@/components/data-grid/data-grid"
import { useDataGrid } from "@/hooks/use-data-grid"
import type { WorkoutGridRow } from "./types"
import { createEmptyExerciseRow } from "./utils"

interface WorkoutGridV2Props {
  workoutId: string
  rows: WorkoutGridRow[]
  onRowsChange: (rows: WorkoutGridRow[]) => void
}

/**
 * WorkoutGridV2 - A data grid component for editing workouts
 *
 * Uses the new flat row model optimized for AI-assisted editing.
 * Works directly with WorkoutGridRow[] instead of converting from nested blocks.
 * Each row has a stable ID that doesn't change on insert/delete.
 */
export function WorkoutGridV2({ rows, onRowsChange }: WorkoutGridV2Props) {
  // Column definitions
  const columns = React.useMemo<ColumnDef<WorkoutGridRow>[]>(
    () => [
      {
        id: "exerciseName",
        accessorKey: "exerciseName",
        header: "Exercise",
        size: 200,
        meta: {
          label: "Exercise",
          cell: { variant: "short-text" },
        },
      },
      {
        id: "sets",
        accessorKey: "sets",
        header: "Sets",
        size: 80,
        meta: {
          label: "Sets",
          cell: { variant: "short-text" },
        },
      },
      {
        id: "reps",
        accessorKey: "reps",
        header: "Reps",
        size: 100,
        meta: {
          label: "Reps",
          cell: { variant: "short-text" },
        },
      },
      {
        id: "weight",
        accessorKey: "weight",
        header: "Weight",
        size: 100,
        meta: {
          label: "Weight",
          cell: { variant: "short-text" },
        },
      },
      {
        id: "rest",
        accessorKey: "rest",
        header: "Rest",
        size: 80,
        meta: {
          label: "Rest",
          cell: { variant: "short-text" },
        },
      },
      {
        id: "notes",
        accessorKey: "notes",
        header: "Notes",
        size: 200,
        meta: {
          label: "Notes",
          cell: { variant: "long-text" },
        },
      },
    ],
    []
  )

  // Handle data changes from the grid
  const handleDataChange = React.useCallback(
    (newRows: WorkoutGridRow[]) => {
      // Reorder rows to ensure consistent ordering
      const reorderedRows = newRows.map((row, index) => ({
        ...row,
        order: index,
      }))
      onRowsChange(reorderedRows)
    },
    [onRowsChange]
  )

  // Handle adding a new row
  const handleRowAdd = React.useCallback(() => {
    const maxOrder =
      rows.length > 0 ? Math.max(...rows.map((r) => r.order)) : -1
    const newRow = createEmptyExerciseRow(maxOrder + 1)
    const newRows = [...rows, newRow]
    handleDataChange(newRows)

    return {
      rowIndex: newRows.length - 1,
      columnId: "exerciseName",
    }
  }, [rows, handleDataChange])

  // Handle deleting rows
  const handleRowsDelete = React.useCallback(
    (rowsToDelete: WorkoutGridRow[]) => {
      const idsToDelete = new Set(rowsToDelete.map((r) => r.id))

      // If deleting a circuit header, also delete its exercises
      const circuitIdsToDelete = new Set(
        rowsToDelete
          .filter((r) => r.type === "circuit-header")
          .map((r) => r.circuitId)
      )

      const newRows = rows.filter((row) => {
        // Remove if directly selected
        if (idsToDelete.has(row.id)) return false
        // Remove if part of a deleted circuit
        if (row.isInCircuit && circuitIdsToDelete.has(row.circuitId))
          return false
        return true
      })

      // Reorder remaining rows
      const reorderedRows = newRows.map((row, index) => ({
        ...row,
        order: index,
      }))

      handleDataChange(reorderedRows)
    },
    [rows, handleDataChange]
  )

  // Set up the data grid
  const { table, ...dataGridProps } = useDataGrid({
    data: rows,
    columns,
    onDataChange: handleDataChange,
    onRowAdd: handleRowAdd,
    onRowsDelete: handleRowsDelete,
    getRowId: (row) => row.id,
    enableSearch: true,
    enablePaste: true,
  })

  return (
    <div className="flex flex-col gap-4">
      <DataGrid {...dataGridProps} height={500} stretchColumns table={table} />
    </div>
  )
}
