/*
  Shared type definitions and type guards for the WorkoutGrid component family.
  Keeping these in one place eliminates duplication and makes it easier to reuse across split files.
*/

//#region Basic positional helpers
export interface Position {
  row: number
  col: number
}
//#endregion

//#region Cell definition
type InputType = "input" | "select" | "display"
export type ProposedChangeType = "adding" | "removing" | "updating"

export interface Cell {
  /* UI */
  type: InputType
  value: string
  colType: string
  width: number
  colIndex: number
  readOnly?: boolean

  /* Workout structure */
  isCircuitHeader?: boolean
  blockType?: "exercise" | "circuit"
  originalBlockIndex?: number
  isCircuitExercise?: boolean
  exerciseIndexInCircuit?: number

  /* Change-tracking */
  isProposed?: boolean
  proposedChangeIndex?: number
  proposedChangeType?: ProposedChangeType
  isIndividualChange?: boolean
  pendingStatus?: {
    type: ProposedChangeType
    proposalId: string
  }
}
//#endregion

//#region Change payload definitions
export interface CellChange {
  type: "cell"
  cell: Cell
  oldValue: string
  newValue: string
}

export interface ExerciseSelection {
  type: "exercise-selection"
  cell: Cell
  exercise: {
    id: string
    name: string
  }
  oldExercise: {
    id: string
    name: string
  }
}

export type GridChange = CellChange | ExerciseSelection
//#endregion

//#region Type guards
export function isExerciseSelection(
  change: GridChange
): change is ExerciseSelection {
  return change.type === "exercise-selection"
}

export function isCellChange(change: GridChange): change is CellChange {
  return change.type === "cell"
}
//#endregion
