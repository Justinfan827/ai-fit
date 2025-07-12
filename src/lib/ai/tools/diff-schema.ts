import { z } from "zod"
import {
  blockSchema,
  exerciseBlockSchema,
} from "@/lib/domain/workouts_ai_response"

// Base schema with ID for tracking proposals
const baseChangeSchema = z.object({
  id: z.string().describe("Unique identifier for this change proposal"),
})

const updateBlockAISchema = z.object({
  type: z.literal("update-block"),
  workoutIndex: z
    .number()
    .describe("The index of the workout to update the block in"),
  blockIndex: z.number().describe("The index of the block to update"),
  block: blockSchema.describe("The updated block"),
})

const updateBlockSchema = baseChangeSchema
  .extend(updateBlockAISchema.shape)
  .describe("Update a block in the workout program")

const addBlockAISchema = z.object({
  type: z.literal("add-block"),
  workoutIndex: z
    .number()
    .describe("The index of the workout to add the block to"),
  blockIndex: z.number().describe("The index of the block to add"),
  block: blockSchema.describe("The block to add"),
})
const addBlockSchema = baseChangeSchema
  .extend(addBlockAISchema.shape)
  .describe("Add a block to the workout program")

const removeBlockAISchema = z.object({
  type: z.literal("remove-block"),
  workoutIndex: z
    .number()
    .describe("The index of the workout to remove the block from"),
  blockIndex: z.number().describe("The index of the block to remove"),
})
const removeBlockSchema = baseChangeSchema
  .extend(removeBlockAISchema.shape)
  .describe("Remove a block from the workout program")

const addCircuitExerciseAISchema = z.object({
  type: z.literal("add-circuit-exercise"),
  workoutIndex: z
    .number()
    .describe("The index of the workout to add the exercise to"),
  circuitBlockIndex: z
    .number()
    .describe("The index of the circuit block to add the exercise to"),
  exerciseIndex: z.number().describe("The index of the exercise to add"),
  exercise: exerciseBlockSchema.describe("The exercise to add"),
})
const addCircuitExerciseSchema = baseChangeSchema
  .extend(addCircuitExerciseAISchema.shape)
  .describe("Add an exercise to a circuit block")

const removeCircuitExerciseAISchema = z.object({
  type: z.literal("remove-circuit-exercise"),
  workoutIndex: z
    .number()
    .describe("The index of the workout to remove the exercise from"),
  circuitBlockIndex: z
    .number()
    .describe("The index of the circuit block to remove the exercise from"),
  exerciseIndex: z.number().describe("The index of the exercise to remove"),
})
const removeCircuitExerciseSchema = baseChangeSchema
  .extend(removeCircuitExerciseAISchema.shape)
  .describe("Remove an exercise from a circuit block")

const updateCircuitExerciseAISchema = z.object({
  type: z.literal("update-circuit-exercise"),
  workoutIndex: z
    .number()
    .describe("The index of the workout to update the exercise in"),
  circuitBlockIndex: z
    .number()
    .describe("The index of the circuit block to update the exercise in"),
  exerciseIndex: z.number().describe("The index of the exercise to update"),
  exercise: exerciseBlockSchema.describe("The updated exercise"),
})
const updateCircuitExerciseSchema = baseChangeSchema
  .extend(updateCircuitExerciseAISchema.shape)
  .describe("Update an exercise in a circuit block")

// workoutChangeAISchema is the schema we pass to the LLM.
// No UUID's. We generate them manually.
const workoutChangeAISchema = z.union([
  updateBlockAISchema,
  addBlockAISchema,
  removeBlockAISchema,
  addCircuitExerciseAISchema,
  removeCircuitExerciseAISchema,
  updateCircuitExerciseAISchema,
])

const workoutChangeSchema = z.union([
  updateBlockSchema,
  addBlockSchema,
  removeBlockSchema,
  addCircuitExerciseSchema,
  removeCircuitExerciseSchema,
  updateCircuitExerciseSchema,
])

type WorkoutChange = z.infer<typeof workoutChangeSchema>
type WorkoutChangeAI = z.infer<typeof workoutChangeAISchema>
type UpdateBlockAI = z.infer<typeof updateBlockAISchema>
type AddBlockAI = z.infer<typeof addBlockAISchema>
type RemoveBlockAI = z.infer<typeof removeBlockAISchema>
type AddCircuitExerciseAI = z.infer<typeof addCircuitExerciseAISchema>
type RemoveCircuitExerciseAI = z.infer<typeof removeCircuitExerciseAISchema>
type UpdateCircuitExerciseAI = z.infer<typeof updateCircuitExerciseAISchema>

export {
  workoutChangeAISchema,
  addBlockSchema,
  addCircuitExerciseSchema,
  removeBlockSchema,
  removeCircuitExerciseSchema,
  updateBlockSchema,
  updateCircuitExerciseSchema,
  workoutChangeSchema,
  type WorkoutChange,
  type WorkoutChangeAI,
  type UpdateBlockAI,
  type AddBlockAI,
  type RemoveBlockAI,
  type AddCircuitExerciseAI,
  type RemoveCircuitExerciseAI,
  type UpdateCircuitExerciseAI,
}
