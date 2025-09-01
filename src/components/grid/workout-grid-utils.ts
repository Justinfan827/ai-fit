import type {
  CircuitBlock,
  ExerciseBlock,
  Workout,
} from "@/lib/domain/workouts"
import { cn } from "@/lib/utils"
import type { Column } from "./columns"
import type { Cell, GridChange } from "./workout-grid-types"
import {
  isCellChange,
  isExerciseSelection,
  isRowDeletion,
} from "./workout-grid-types"

/**
 * Compute convenience boolean flags for a given grid cell.
 */
export function getRowStyles(cell: Cell, currentChangeId: string | null) {
  return {
    circuitHeader: cell.isCircuitHeader,
    circuitExercise: cell.isCircuitExercise,
    standaloneExercise: !(cell.isCircuitHeader || cell.isCircuitExercise),
    proposedChange: cell.isProposed,
    currentChange:
      cell.isProposed && cell.pendingStatus?.proposalId === currentChangeId,
  }
}

/**
 * Build the className string for a cell using Tailwind classes.
 */
export function getCellClasses(
  cell: Cell,
  baseClasses: string,
  currentChangeId: string | null
) {
  const styles = getRowStyles(cell, currentChangeId)

  return cn(
    baseClasses,
    styles.currentChange &&
      cell.proposedChangeType === "adding" &&
      "border-green-400/70 bg-green-800/50 ring-1 ring-green-400/30",
    styles.currentChange &&
      cell.proposedChangeType === "adding" &&
      cell.colIndex === 0 &&
      "shadow-[-3px_0_0_0_rgb(34_197_94_/_0.9)]",
    styles.currentChange &&
      cell.proposedChangeType === "removing" &&
      "border-red-400/70 bg-red-800/50 opacity-90 ring-1 ring-red-400/30",
    styles.currentChange &&
      cell.proposedChangeType === "removing" &&
      cell.colIndex === 0 &&
      "shadow-[-3px_0_0_0_rgb(239_68_68_/_0.9)]",
    styles.currentChange &&
      cell.proposedChangeType === "updating" &&
      "border-blue-400/70 bg-blue-800/50 ring-1 ring-blue-400/30",
    styles.currentChange &&
      cell.proposedChangeType === "updating" &&
      cell.colIndex === 0 &&
      "shadow-[-3px_0_0_0_rgb(59_130_246_/_0.9)]",
    !styles.currentChange &&
      styles.proposedChange &&
      cell.proposedChangeType === "adding" &&
      "border-green-500/50 bg-green-950/30",
    !styles.currentChange &&
      styles.proposedChange &&
      cell.proposedChangeType === "adding" &&
      cell.colIndex === 0 &&
      "shadow-[-2px_0_0_0_rgb(34_197_94_/_0.7)]",
    !styles.currentChange &&
      styles.proposedChange &&
      cell.proposedChangeType === "removing" &&
      "border-red-500/50 bg-red-950/30 opacity-75",
    !styles.currentChange &&
      styles.proposedChange &&
      cell.proposedChangeType === "removing" &&
      cell.colIndex === 0 &&
      "shadow-[-2px_0_0_0_rgb(239_68_68_/_0.7)]",
    !styles.currentChange &&
      styles.proposedChange &&
      cell.proposedChangeType === "updating" &&
      "border-blue-500/50 bg-blue-950/30",
    !styles.currentChange &&
      styles.proposedChange &&
      cell.proposedChangeType === "updating" &&
      cell.colIndex === 0 &&
      "shadow-[-2px_0_0_0_rgb(59_130_246_/_0.7)]",
    !styles.proposedChange &&
      styles.circuitHeader &&
      "bg-neutral-900 font-medium text-orange-400",
    !styles.proposedChange &&
      styles.circuitHeader &&
      cell.colIndex === 0 &&
      "shadow-[-2px_0_0_0_rgb(251_146_60_/_0.5)]",
    !styles.proposedChange &&
      styles.circuitExercise &&
      cell.colIndex === 0 &&
      "bg-neutral-925 shadow-[-2px_0_0_0_rgb(251_146_60_/_0.5)]",
    !styles.proposedChange && styles.standaloneExercise && "bg-neutral-950"
  )
}

/**
 * Map a Workout domain object into a 2-D Cell grid representation.
 */
export function createGridFromWorkoutWithChanges(
  workout: Workout,
  columns: Column[]
): Cell[][] {
  console.log({ workout })
  const grid: Cell[][] = []
  let currentRowIndex = 0

  workout.blocks.forEach((block, blockIndex) => {
    const blockPendingStatus = block.pendingStatus
    const isBlockProposed = blockPendingStatus !== undefined
    const blockChangeIndex = isBlockProposed ? 0 : undefined

    if (block.type === "exercise") {
      const exerciseRow = columns.map((col, colIndex) => ({
        type:
          col.field === "exercise_name"
            ? ("select" as const)
            : ("input" as const),
        value: getValueFromBlock(block, col.field),
        colType: col.field,
        width: col.width || 100,
        rowIndex: currentRowIndex,
        colIndex,
        blockType: "exercise" as const,
        originalBlockIndex: blockIndex,
        isCircuitExercise: false,
        isProposed: isBlockProposed,
        proposedChangeIndex: blockChangeIndex,
        proposedChangeType: blockPendingStatus?.type,
        pendingStatus: blockPendingStatus,
      }))
      grid.push(exerciseRow)
      currentRowIndex++
    } else if (block.type === "circuit") {
      const circuitHeaderRow = columns.map((col, colIndex) => ({
        type: "input" as const,
        value: getValueFromCircuitBlock(block, col.field),
        colType: col.field,
        width: col.width || 100,
        rowIndex: currentRowIndex,
        colIndex,
        isCircuitHeader: true,
        blockType: "circuit" as const,
        originalBlockIndex: blockIndex,
        readOnly: col.field === "reps" || col.field === "weight",
        isCircuitExercise: false,
        isProposed: isBlockProposed,
        proposedChangeIndex: blockChangeIndex,
        proposedChangeType: blockPendingStatus?.type,
        pendingStatus: blockPendingStatus,
      }))
      grid.push(circuitHeaderRow)
      currentRowIndex++

      block.circuit.exercises.forEach((exerciseBlock, exerciseIndex) => {
        const exercisePendingStatus = exerciseBlock.pendingStatus
        const isExerciseProposed = exercisePendingStatus !== undefined
        const exerciseChangeIndex = isExerciseProposed ? 0 : undefined

        const exerciseRow = columns.map((col, colIndex) => ({
          type:
            col.field === "exercise_name"
              ? ("select" as const)
              : ("input" as const),
          value: getValueFromBlock(exerciseBlock, col.field),
          colType: col.field,
          width: col.width || 100,
          rowIndex: currentRowIndex,
          colIndex,
          readOnly: col.field === "sets" || col.field === "rest",
          blockType: "exercise" as const,
          originalBlockIndex: blockIndex,
          isCircuitExercise: true,
          exerciseIndexInCircuit: exerciseIndex,
          isProposed: isBlockProposed || isExerciseProposed,
          proposedChangeIndex: isExerciseProposed
            ? exerciseChangeIndex
            : isBlockProposed
              ? blockChangeIndex
              : undefined,
          proposedChangeType: isExerciseProposed
            ? exercisePendingStatus?.type
            : isBlockProposed
              ? blockPendingStatus?.type
              : undefined,
          isIndividualChange: isExerciseProposed,
          pendingStatus: isExerciseProposed
            ? exercisePendingStatus
            : isBlockProposed
              ? blockPendingStatus
              : undefined,
        }))
        grid.push(exerciseRow)
        currentRowIndex++
      })
    }
  })

  return grid
}

function getValueFromBlock(block: ExerciseBlock, field: string): string {
  switch (field) {
    case "exercise_name":
      return block.exercise.name
    case "sets":
      return block.exercise.metadata.sets
    case "reps":
      return block.exercise.metadata.reps
    case "weight":
      return block.exercise.metadata.weight
    case "rest":
      return block.exercise.metadata.rest
    case "notes":
      return block.exercise.metadata.notes || ""
    default:
      return ""
  }
}

function getValueFromCircuitBlock(block: CircuitBlock, field: string): string {
  switch (field) {
    case "exercise_name":
      return block.circuit.name
    case "sets":
      return block.circuit.metadata.sets
    case "reps":
      return ""
    case "weight":
      return ""
    case "rest":
      return block.circuit.metadata.rest
    case "notes":
      return block.circuit.metadata.notes || ""
    default:
      return ""
  }
}

/**
 * Apply a granular cell/exercise-selection/row-deletion change to the Workout object.
 */
export function applyIncrementalChange(
  change: GridChange,
  workout: Workout
): Workout {
  const cell = change.cell
  if (!cell) return workout

  // Handle row deletion
  if (isRowDeletion(change)) {
    const newBlocks = [...workout.blocks]
    const blockIndex = change.blockIndex

    if (change.exerciseIndexInCircuit !== undefined) {
      // Deleting an exercise within a circuit
      const circuitBlock = newBlocks[blockIndex]
      if (circuitBlock?.type === "circuit") {
        const updatedCircuitBlock = {
          ...circuitBlock,
          circuit: {
            ...circuitBlock.circuit,
            exercises: circuitBlock.circuit.exercises.filter(
              (_, index) => index !== change.exerciseIndexInCircuit
            ),
          },
        }
        newBlocks[blockIndex] = updatedCircuitBlock
      }
    } else {
      // Deleting an entire block (exercise or circuit)
      newBlocks.splice(blockIndex, 1)
    }

    return { ...workout, blocks: newBlocks }
  }

  const newBlocks = [...workout.blocks]
  const originalBlockIndex = cell.originalBlockIndex
  if (originalBlockIndex === undefined) return workout

  const blockToUpdate = newBlocks[originalBlockIndex]
  if (!blockToUpdate) return workout

  if (blockToUpdate.type === "exercise") {
    const updatedBlock = { ...blockToUpdate }

    if (isExerciseSelection(change)) {
      updatedBlock.exercise = {
        ...updatedBlock.exercise,
        id: change.exercise.id,
        name: change.exercise.name,
      }
    } else if (isCellChange(change)) {
      if (cell.colType === "exercise_name") {
        updatedBlock.exercise = {
          ...updatedBlock.exercise,
          name: change.newValue,
        }
      } else {
        updatedBlock.exercise = {
          ...updatedBlock.exercise,
          metadata: {
            ...updatedBlock.exercise.metadata,
            [cell.colType]: change.newValue,
          },
        }
      }
    }

    newBlocks[originalBlockIndex] = updatedBlock
  } else if (blockToUpdate.type === "circuit") {
    const updatedBlock = {
      ...blockToUpdate,
      circuit: { ...blockToUpdate.circuit },
    }

    if (cell.isCircuitHeader) {
      if (isCellChange(change)) {
        if (cell.colType === "exercise_name") {
          updatedBlock.circuit.name = change.newValue
        } else if (["rest", "notes"].includes(cell.colType)) {
          updatedBlock.circuit.metadata = {
            ...updatedBlock.circuit.metadata,
            [cell.colType]: change.newValue,
          }
        } else if (cell.colType === "sets") {
          updatedBlock.circuit.metadata.sets = change.newValue
          for (const exercise of updatedBlock.circuit.exercises) {
            exercise.exercise.metadata.sets = change.newValue
          }
        }
      }
    } else {
      const exerciseIndexInCircuit = cell.exerciseIndexInCircuit
      if (exerciseIndexInCircuit !== undefined && exerciseIndexInCircuit >= 0) {
        const updatedExercises = [...updatedBlock.circuit.exercises]
        const exerciseToUpdate = { ...updatedExercises[exerciseIndexInCircuit] }

        if (isExerciseSelection(change)) {
          exerciseToUpdate.exercise = {
            ...exerciseToUpdate.exercise,
            id: change.exercise.id,
            name: change.exercise.name,
          }
        } else if (isCellChange(change)) {
          if (cell.colType === "exercise_name") {
            exerciseToUpdate.exercise = {
              ...exerciseToUpdate.exercise,
              name: change.newValue,
            }
          } else {
            exerciseToUpdate.exercise = {
              ...exerciseToUpdate.exercise,
              metadata: {
                ...exerciseToUpdate.exercise.metadata,
                [cell.colType]: change.newValue,
              },
            }
          }
        }

        updatedExercises[exerciseIndexInCircuit] = exerciseToUpdate
        updatedBlock.circuit.exercises = updatedExercises
      }
    }

    newBlocks[originalBlockIndex] = updatedBlock
  }

  return { ...workout, blocks: newBlocks }
}
