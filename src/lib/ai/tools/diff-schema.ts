import {
  blockSchema,
  exerciseBlockSchema,
} from '@/lib/domain/workouts_ai_response'
import { z } from 'zod'

// Base schema with ID for tracking proposals
const baseChangeSchema = z.object({
  id: z.string().describe('Unique identifier for this change proposal'),
})

const updateBlockSchema = baseChangeSchema
  .extend({
    type: z.literal('update-block'),
    workoutIndex: z
      .number()
      .describe('The index of the workout to update the block in'),
    blockIndex: z.number().describe('The index of the block to update'),
    block: blockSchema.describe('The updated block'),
  })
  .describe('Update a block in the workout program')

const addBlockSchema = baseChangeSchema
  .extend({
    type: z.literal('add-block'),
    workoutIndex: z
      .number()
      .describe('The index of the workout to add the block to'),
    blockIndex: z.number().describe('The index of the block to add'),
    block: blockSchema.describe('The block to add'),
  })
  .describe('Add a block to the workout program')

const removeBlockSchema = baseChangeSchema
  .extend({
    type: z.literal('remove-block'),
    workoutIndex: z
      .number()
      .describe('The index of the workout to remove the block from'),
    blockIndex: z.number().describe('The index of the block to remove'),
  })
  .describe('Remove a block from the workout program')

const addCircuitExerciseSchema = baseChangeSchema
  .extend({
    type: z.literal('add-circuit-exercise'),
    workoutIndex: z
      .number()
      .describe('The index of the workout to add the exercise to'),
    circuitBlockIndex: z
      .number()
      .describe('The index of the circuit block to add the exercise to'),
    exerciseIndex: z.number().describe('The index of the exercise to add'),
    exercise: exerciseBlockSchema.describe('The exercise to add'),
  })
  .describe('Add an exercise to a circuit block')

const removeCircuitExerciseSchema = baseChangeSchema
  .extend({
    type: z.literal('remove-circuit-exercise'),
    workoutIndex: z
      .number()
      .describe('The index of the workout to remove the exercise from'),
    circuitBlockIndex: z
      .number()
      .describe('The index of the circuit block to remove the exercise from'),
    exerciseIndex: z.number().describe('The index of the exercise to remove'),
  })
  .describe('Remove an exercise from a circuit block')

const updateCircuitExerciseSchema = baseChangeSchema
  .extend({
    type: z.literal('update-circuit-exercise'),
    workoutIndex: z
      .number()
      .describe('The index of the workout to update the exercise in'),
    circuitBlockIndex: z
      .number()
      .describe('The index of the circuit block to update the exercise in'),
    exerciseIndex: z.number().describe('The index of the exercise to update'),
    exercise: exerciseBlockSchema.describe('The updated exercise'),
  })
  .describe('Update an exercise in a circuit block')

const workoutChangeSchema = z.union([
  updateBlockSchema,
  addBlockSchema,
  removeBlockSchema,
  addCircuitExerciseSchema,
  removeCircuitExerciseSchema,
  updateCircuitExerciseSchema,
])

type WorkoutChange = z.infer<typeof workoutChangeSchema>

export {
  addBlockSchema,
  addCircuitExerciseSchema,
  removeBlockSchema,
  removeCircuitExerciseSchema,
  updateBlockSchema,
  updateCircuitExerciseSchema,
  workoutChangeSchema,
  type WorkoutChange,
}
