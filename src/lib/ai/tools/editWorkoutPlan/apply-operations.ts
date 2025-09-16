import { v4 as uuidv4 } from "uuid"
import type { AIBlock, AIWorkout } from "@/lib/ai/tools/ai-only-schema"
import type { Block, Workout } from "@/lib/domain/workouts"
import type {
  EditWorkoutPlanAction,
  EditWorkoutPlanActions,
  EditWorkoutPlanInsertAfterAction,
  EditWorkoutPlanInsertAtEndAction,
  EditWorkoutPlanInsertAtStartAction,
  EditWorkoutPlanInsertBeforeAction,
  EditWorkoutPlanRemoveAction,
  EditWorkoutPlanSwapAction,
} from "./schemas"

/**
 * Pure utility function that applies workout plan operations to a workouts array.
 * This function is independent of Zustand and can be easily unit tested.
 */
export const applyWorkoutPlanOperations = (
  workouts: Workout[],
  actions: EditWorkoutPlanActions
): Workout[] => {
  let result = [...workouts]

  for (const operation of actions) {
    result = applyOperation(result, operation)
  }

  return result
}

/**
 * Apply a single operation to the workouts array
 */
const applyOperation = (
  workouts: Workout[],
  operation: EditWorkoutPlanAction
): Workout[] => {
  switch (operation.type) {
    case "insertAfter":
      return handleInsertAfter(workouts, operation)
    case "insertBefore":
      return handleInsertBefore(workouts, operation)
    case "insertAtStart":
      return handleInsertAtStart(workouts, operation)
    case "insertAtEnd":
      return handleInsertAtEnd(workouts, operation)
    case "swap":
      return handleSwap(workouts, operation)
    case "remove":
      return handleRemove(workouts, operation)
    default: {
      // TypeScript exhaustiveness check
      const _exhaustive: never = operation
      throw new Error(`Unknown operation type: ${JSON.stringify(operation)}`)
    }
  }
}

/**
 * Insert a workout after the specified anchor workout
 */
const handleInsertAfter = (
  workouts: Workout[],
  operation: EditWorkoutPlanInsertAfterAction
): Workout[] => {
  const anchorIndex = workouts.findIndex(
    (w) => w.id === operation.anchorWorkoutId
  )
  if (anchorIndex === -1) {
    throw new Error(
      `Anchor workout with ID ${operation.anchorWorkoutId} not found`
    )
  }

  const newWorkout = prepareWorkout(operation.workout, workouts)
  const result = [...workouts]
  result.splice(anchorIndex + 1, 0, newWorkout)

  return updateProgramOrders(result)
}

/**
 * Insert a workout before the specified anchor workout
 */
const handleInsertBefore = (
  workouts: Workout[],
  operation: EditWorkoutPlanInsertBeforeAction
): Workout[] => {
  const anchorIndex = workouts.findIndex(
    (w) => w.id === operation.anchorWorkoutId
  )
  if (anchorIndex === -1) {
    throw new Error(
      `Anchor workout with ID ${operation.anchorWorkoutId} not found`
    )
  }

  const newWorkout = prepareWorkout(operation.workout, workouts)
  const result = [...workouts]
  result.splice(anchorIndex, 0, newWorkout)

  return updateProgramOrders(result)
}

/**
 * Insert a workout at the start of the plan
 */
const handleInsertAtStart = (
  workouts: Workout[],
  operation: EditWorkoutPlanInsertAtStartAction
): Workout[] => {
  const newWorkout = prepareWorkout(operation.workout, workouts)
  const result = [newWorkout, ...workouts]

  return updateProgramOrders(result)
}

/**
 * Insert a workout at the end of the plan
 */
const handleInsertAtEnd = (
  workouts: Workout[],
  operation: EditWorkoutPlanInsertAtEndAction
): Workout[] => {
  const newWorkout = prepareWorkout(operation.workout, workouts)
  const result = [...workouts, newWorkout]

  return updateProgramOrders(result)
}

/**
 * Swap the positions of two workouts
 */
const handleSwap = (
  workouts: Workout[],
  operation: EditWorkoutPlanSwapAction
): Workout[] => {
  const aIndex = workouts.findIndex((w) => w.id === operation.aWorkoutId)
  const bIndex = workouts.findIndex((w) => w.id === operation.bWorkoutId)

  if (aIndex === -1) {
    throw new Error(`Workout with ID ${operation.aWorkoutId} not found`)
  }
  if (bIndex === -1) {
    throw new Error(`Workout with ID ${operation.bWorkoutId} not found`)
  }

  const result = [...workouts]
  const temp = result[aIndex]
  result[aIndex] = result[bIndex]
  result[bIndex] = temp

  return updateProgramOrders(result)
}

/**
 * Remove a workout from the plan
 */
const handleRemove = (
  workouts: Workout[],
  operation: EditWorkoutPlanRemoveAction
): Workout[] => {
  const workoutIndex = workouts.findIndex((w) => w.id === operation.workoutId)
  if (workoutIndex === -1) {
    throw new Error(`Workout with ID ${operation.workoutId} not found`)
  }

  const result = workouts.filter((w) => w.id !== operation.workoutId)

  return updateProgramOrders(result)
}

/**
 * Transform AI blocks to full blocks with all required properties
 */
const transformAIBlocksToBlocks = (aiBlocks: AIBlock[]): Block[] => {
  return aiBlocks.map((aiBlock): Block => {
    if (aiBlock.type === "exercise") {
      return {
        ...aiBlock,
        pendingStatus: undefined,
      }
    }

    // circuit block
    return {
      ...aiBlock,
      circuit: {
        ...aiBlock.circuit,
        isDefault: false,
        exercises: aiBlock.circuit.exercises.map((exercise) => ({
          ...exercise,
          pendingStatus: undefined,
        })),
      },
      pendingStatus: undefined,
    }
  })
}

/**
 * Prepare a workout by ensuring it has an ID and extracting the program_id from existing workouts
 */
const prepareWorkout = (
  workout: AIWorkout & { id?: string; name?: string },
  existingWorkouts: Workout[]
): Workout => {
  // Generate ID if missing
  const id = workout.id || uuidv4()

  // Extract program_id from first existing workout, or generate one if none exist
  const program_id =
    existingWorkouts.length > 0 ? existingWorkouts[0].program_id : uuidv4()

  return {
    id,
    program_id,
    name: workout.name || "New Workout",
    blocks: workout.blocks ? transformAIBlocksToBlocks(workout.blocks) : [],
    program_order: 0, // Will be updated by updateProgramOrders
  }
}

/**
 * Update program_order for all workouts based on their position in the array
 */
const updateProgramOrders = (workouts: Workout[]): Workout[] => {
  return workouts.map((workout, index) => ({
    ...workout,
    program_order: index,
  }))
}
