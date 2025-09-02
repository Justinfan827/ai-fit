import { cloneDeep } from "lodash"

import type { WorkoutChange } from "@/lib/ai/tools/generateProgramDiffs/diff-schema"
import type { Block, ExerciseBlock, Workout } from "@/lib/domain/workouts"
import log from "@/lib/logger/logger"

/*
This function is used to merge the proposed changes into the workout.
It is used to update the workout with the proposed changes.

Changes are processed in the following order:
1. Removals (remove-block, remove-circuit-exercise)
2. Updates (update-block, update-circuit-exercise)
3. Additions for circuit exercises (add-circuit-exercise) - sorted by circuit block index descending, then exercise index descending
4. Additions for blocks (add-block) - sorted by block index descending

This order ensures that:
- Index-shifting operations (additions) happen last, after all other operations that rely on original indices
- Additions are processed from highest index to lowest index to avoid index shifting issues
*/

type GroupedChanges = Record<WorkoutChange["type"], WorkoutChange[]>

const filterChangesForWorkout = (
  changes: WorkoutChange[],
  workoutIndex: number
): WorkoutChange[] => {
  return changes.filter((change) => change.workoutIndex === workoutIndex)
}

const groupAndSortChanges = (changes: WorkoutChange[]): WorkoutChange[] => {
  // Group changes by type
  const groupedChanges: GroupedChanges = {
    "remove-block": changes.filter((c) => c.type === "remove-block"),
    "remove-circuit-exercise": changes.filter(
      (c) => c.type === "remove-circuit-exercise"
    ),
    "update-block": changes.filter((c) => c.type === "update-block"),
    "update-circuit-exercise": changes.filter(
      (c) => c.type === "update-circuit-exercise"
    ),
    "add-circuit-exercise": changes.filter(
      (c) => c.type === "add-circuit-exercise"
    ),
    "add-block": changes.filter((c) => c.type === "add-block"),
  }

  // Sort each group as needed
  // For add-circuit-exercise: sort by circuitBlockIndex descending, then exerciseIndex descending
  ;(
    groupedChanges["add-circuit-exercise"] as Array<
      WorkoutChange & { type: "add-circuit-exercise" }
    >
  ).sort((a, b) => {
    const circuitBlockDiff = b.circuitBlockIndex - a.circuitBlockIndex
    if (circuitBlockDiff !== 0) {
      return circuitBlockDiff
    }
    return b.exerciseIndex - a.exerciseIndex
  })

  // For add-block: sort by blockIndex descending
  ;(
    groupedChanges["add-block"] as Array<WorkoutChange & { type: "add-block" }>
  ).sort((a, b) => b.blockIndex - a.blockIndex)

  // Flatten back to single array in processing order
  return [
    ...groupedChanges["remove-block"],
    ...groupedChanges["remove-circuit-exercise"],
    ...groupedChanges["update-block"],
    ...groupedChanges["update-circuit-exercise"],
    ...groupedChanges["add-circuit-exercise"],
    ...groupedChanges["add-block"],
  ]
}

const applyAddBlock = (
  workout: Workout,
  change: WorkoutChange & { type: "add-block" }
): void => {
  const newBlock: Block = {
    ...change.block,
    pendingStatus: { type: "adding", proposalId: change.id },
  }
  workout.blocks.splice(change.blockIndex, 0, newBlock)
}

const applyUpdateBlock = (
  workout: Workout,
  change: WorkoutChange & { type: "update-block" }
): void => {
  const blockToUpdate = workout.blocks[change.blockIndex]
  const updatedBlock: Block = {
    ...change.block,
    pendingStatus: {
      type: "updating",
      oldBlock: blockToUpdate,
      proposalId: change.id,
    },
  }
  workout.blocks[change.blockIndex] = updatedBlock
}

const applyRemoveBlock = (
  workout: Workout,
  change: WorkoutChange & { type: "remove-block" }
): void => {
  const blockToRemove = workout.blocks[change.blockIndex]
  const removedBlock: Block = {
    ...blockToRemove,
    pendingStatus: { type: "removing", proposalId: change.id },
  }
  workout.blocks[change.blockIndex] = removedBlock
}

const applyAddCircuitExercise = (
  workout: Workout,
  change: WorkoutChange & { type: "add-circuit-exercise" }
): void => {
  const circuitBlock = workout.blocks[change.circuitBlockIndex]
  if (circuitBlock.type !== "circuit") {
    log.error("Attempted to add an exercise to a non-circuit block", {
      change,
    })
    return
  }

  const newExercise: ExerciseBlock = {
    ...change.exercise,
    pendingStatus: { type: "adding", proposalId: change.id },
  }

  const targetCircuitBlock = workout.blocks[change.circuitBlockIndex]
  if (targetCircuitBlock.type === "circuit") {
    targetCircuitBlock.circuit.exercises.splice(
      change.exerciseIndex,
      0,
      newExercise
    )
  }
}

const applyRemoveCircuitExercise = (
  workout: Workout,
  change: WorkoutChange & { type: "remove-circuit-exercise" }
): void => {
  const circuitBlockToRemove = workout.blocks[change.circuitBlockIndex]
  if (circuitBlockToRemove.type !== "circuit") {
    log.error("Attempted to remove an exercise from a non-circuit block", {
      change,
    })
    return
  }

  const exerciseToRemove =
    circuitBlockToRemove.circuit.exercises[change.exerciseIndex]
  const exerciseToRemoveWithPendingStatus: ExerciseBlock = {
    ...exerciseToRemove,
    pendingStatus: { type: "removing", proposalId: change.id },
  }

  const targetRemoveCircuitBlock = workout.blocks[change.circuitBlockIndex]
  if (targetRemoveCircuitBlock.type === "circuit") {
    targetRemoveCircuitBlock.circuit.exercises[change.exerciseIndex] =
      exerciseToRemoveWithPendingStatus
  }
}

const applyUpdateCircuitExercise = (
  workout: Workout,
  change: WorkoutChange & { type: "update-circuit-exercise" }
): void => {
  const circuitBlockToUpdate = workout.blocks[change.circuitBlockIndex]
  if (circuitBlockToUpdate.type !== "circuit") {
    log.error("Attempted to update an exercise in a non-circuit block", {
      change,
    })
    return
  }

  const exerciseToUpdate =
    circuitBlockToUpdate.circuit.exercises[change.exerciseIndex]
  const exerciseToUpdateWithPendingStatus: ExerciseBlock = {
    ...change.exercise,
    pendingStatus: {
      type: "updating",
      oldBlock: exerciseToUpdate,
      proposalId: change.id,
    },
  }

  const targetUpdateCircuitBlock = workout.blocks[change.circuitBlockIndex]
  if (targetUpdateCircuitBlock.type === "circuit") {
    targetUpdateCircuitBlock.circuit.exercises[change.exerciseIndex] =
      exerciseToUpdateWithPendingStatus
  }
}

const applyChange = (workout: Workout, change: WorkoutChange): void => {
  switch (change.type) {
    case "add-block":
      applyAddBlock(workout, change)
      break
    case "update-block":
      applyUpdateBlock(workout, change)
      break
    case "remove-block":
      applyRemoveBlock(workout, change)
      break
    case "add-circuit-exercise":
      applyAddCircuitExercise(workout, change)
      break
    case "remove-circuit-exercise":
      applyRemoveCircuitExercise(workout, change)
      break
    case "update-circuit-exercise":
      applyUpdateCircuitExercise(workout, change)
      break
    default:
      log.error("Unknown change type", { change })
      break
  }
}

export function mergeWorkoutWithProposedChanges(
  workout: Workout,
  proposedChanges: WorkoutChange[],
  workoutIndex: number
) {
  if (!proposedChanges?.length) return workout

  // Filter changes to only those intended for this workout
  const workoutSpecificChanges = filterChangesForWorkout(
    proposedChanges,
    workoutIndex
  )

  // Filter out changes that have already been applied to the current
  // workout
  const existingPendingChangeIDs = workout.blocks.flatMap((block) => {
    if (block.type === "circuit") {
      const pendingIds: string[] = block.pendingStatus
        ? [block.pendingStatus.proposalId]
        : []
      const exercisePendingIds: string[] = block.circuit.exercises
        .map((exercise) => exercise.pendingStatus?.proposalId)
        .filter((id) => id !== undefined)
      return pendingIds.concat(exercisePendingIds)
    }
    if (block.type === "exercise") {
      if (block.pendingStatus) {
        return [block.pendingStatus.proposalId]
      }
      return []
    }
    return []
  })

  const filteredChanges = workoutSpecificChanges.filter(
    (change) => !existingPendingChangeIDs.includes(change.id)
  )
  if (!filteredChanges.length) return workout

  const newWorkout = cloneDeep(workout)
  const sortedChanges = groupAndSortChanges(filteredChanges)

  for (const change of sortedChanges) {
    applyChange(newWorkout, change)
  }

  return newWorkout
}
