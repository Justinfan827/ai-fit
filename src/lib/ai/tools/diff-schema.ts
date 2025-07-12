import { z } from "zod"
import {
  blockSchema,
  exerciseBlockSchema,
} from "@/lib/domain/workouts_ai_response"

// Base schema with ID for tracking proposals
const baseChangeSchema = z.object({
  id: z.string().describe("Unique identifier for this change proposal"),
})

const updateBlockSchemaAI = z.object({
  type: z.literal("update-block"),
  workoutIndex: z
    .number()
    .describe("The index of the workout to update the block in"),
  blockIndex: z.number().describe("The index of the block to update"),
  block: blockSchema.describe("The updated block"),
})

const updateBlockSchema = baseChangeSchema
  .extend(updateBlockSchemaAI.shape)
  .describe("Update a block in the workout program")

const addBlockSchemaAI = z.object({
  type: z.literal("add-block"),
  workoutIndex: z
    .number()
    .describe("The index of the workout to add the block to"),
  blockIndex: z.number().describe("The index of the block to add"),
  block: blockSchema.describe("The block to add"),
})
const addBlockSchema = baseChangeSchema
  .extend(addBlockSchemaAI.shape)
  .describe("Add a block to the workout program")

const removeBlockSchemaAI = z.object({
  type: z.literal("remove-block"),
  workoutIndex: z
    .number()
    .describe("The index of the workout to remove the block from"),
  blockIndex: z.number().describe("The index of the block to remove"),
})
const removeBlockSchema = baseChangeSchema
  .extend(removeBlockSchemaAI.shape)
  .describe("Remove a block from the workout program")

const addCircuitExerciseSchemaAI = z.object({
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
  .extend(addCircuitExerciseSchemaAI.shape)
  .describe("Add an exercise to a circuit block")

const removeCircuitExerciseSchemaAI = z.object({
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
  .extend(removeCircuitExerciseSchemaAI.shape)
  .describe("Remove an exercise from a circuit block")

const updateCircuitExerciseSchemaAI = z.object({
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
  .extend(updateCircuitExerciseSchemaAI.shape)
  .describe("Update an exercise in a circuit block")

// workoutChangeSchemaAI is the schema we pass to the LLM.
// No UUID's. We generate them manually.
const workoutChangeSchemaAI = z.union([
  updateBlockSchemaAI,
  addBlockSchemaAI,
  removeBlockSchemaAI,
  addCircuitExerciseSchemaAI,
  removeCircuitExerciseSchemaAI,
  updateCircuitExerciseSchemaAI,
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
type WorkoutChangeAI = z.infer<typeof workoutChangeSchemaAI>

export {
  workoutChangeSchemaAI,
  addBlockSchema,
  addCircuitExerciseSchema,
  removeBlockSchema,
  removeCircuitExerciseSchema,
  updateBlockSchema,
  updateCircuitExerciseSchema,
  workoutChangeSchema,
  type WorkoutChange,
  type WorkoutChangeAI,
}
