import { v4 as uuidv4 } from "uuid"
import type { WorkoutGridRow } from "./types"

/**
 * Create a new empty exercise row
 *
 * Used when adding a new exercise to the grid.
 * The ID will be replaced with a Convex ID when saved to the database.
 */
export function createEmptyExerciseRow(order: number): WorkoutGridRow {
  return {
    id: `temp-${uuidv4()}`, // Temporary ID until saved to Convex
    type: "exercise",
    exerciseName: "",
    sets: "",
    reps: "",
    weight: "",
    rest: "",
    notes: "",
    isInCircuit: false,
    order,
  }
}

/**
 * Reorder rows to ensure consistent ordering
 *
 * Updates the order field of all rows based on their current position.
 */
export function reorderRows(rows: WorkoutGridRow[]): WorkoutGridRow[] {
  return rows.map((row, index) => ({
    ...row,
    order: index,
  }))
}
