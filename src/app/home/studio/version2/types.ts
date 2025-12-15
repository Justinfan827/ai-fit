/**
 * WorkoutGridRow - Flat row representation for the data grid
 *
 * This is the new data model optimized for AI-assisted editing.
 * Each row represents either an exercise or a circuit header.
 * Rows have stable IDs that don't change on insert/delete.
 */
export interface WorkoutGridRow {
  id: string // Row ID for grid (= _id from workoutExercises or circuits table)
  type: "exercise" | "circuit-header"

  // Exercise data (null for circuit headers)
  exerciseId?: string
  exerciseName: string
  sets: string
  reps: string
  weight: string
  rest: string
  notes: string

  // Circuit info
  circuitId?: string
  circuitName?: string
  isInCircuit: boolean

  // Ordering
  order: number
}

/**
 * PendingChange - Tracks changes that are being streamed from AI
 * but not yet committed to the database
 */
export interface PendingChange {
  id: string // Change ID (for undo)
  type: "adding" | "updating" | "removing"
  field?: string // Which field changed (for cell edits)
  oldValue?: unknown // Previous value (for undo)
  streamedAt: number // Timestamp
  toolCallId?: string // AI tool call that created this
}
