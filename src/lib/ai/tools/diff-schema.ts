import {
  blockSchema,
  exerciseBlockSchema,
} from '@/lib/domain/workouts_ai_response'
import { z } from 'zod'

const replaceBlockSchema = z
  .object({
    type: z.literal('replace-block'),
    workoutIndex: z.number().describe('The index of the workout to replace the block in'),
    blockIndex: z.number().describe('The index of the block to replace'),
    block: blockSchema.describe('The block to replace with'),
  })
  .describe('Replace a block in the workout program')
const addBlockSchema = z
  .object({
    type: z.literal('add-block'),
    workoutIndex: z.number().describe('The index of the workout to add the block to'),
    afterBlockIndex: z.number().describe('The index of the block to add after'),
    block: blockSchema.describe('The block to add'),
  })
  .describe('Add a block to the workout program')

const removeBlockSchema = z
  .object({
    type: z.literal('remove-block'),
    workoutIndex: z.number().describe('The index of the workout to remove the block from'),
    blockIndex: z.number().describe('The index of the block to remove'),
  })
  .describe('Remove a block from the workout program')
const addCircuitExerciseSchema = z
  .object({
    type: z.literal('add-circuit-exercise'),
    workoutIndex: z.number().describe('The index of the workout to add the exercise to'),
    circuitBlockIndex: z
      .number()
      .describe('The index of the circuit block to add the exercise to'),
    afterExerciseIndex: z
      .number()
      .describe(
        'The index of the exercise inside the circuit to add the new exercise after'
      ),
    exercise: exerciseBlockSchema.describe('The exercise to add'),
  })
  .describe('Add an exercise to a circuit block')
const removeCircuitExerciseSchema = z
  .object({
    type: z.literal('remove-circuit-exercise'),
    workoutIndex: z.number().describe('The index of the workout to remove the exercise from'),
    circuitBlockIndex: z
      .number()
      .describe('The index of the circuit block to remove the exercise from'),
    exerciseIndex: z.number().describe('The index of the exercise to remove'),
  })
  .describe('Remove an exercise from a circuit block')

const replaceCircuitExerciseSchema = z
  .object({
    type: z.literal('replace-circuit-exercise'),
    workoutIndex: z.number().describe('The index of the workout to replace the exercise in'),
    circuitBlockIndex: z
      .number()
      .describe('The index of the circuit block to replace the exercise in'),
    exerciseIndex: z.number().describe('The index of the exercise to replace'),
    exercise: exerciseBlockSchema.describe('The exercise to replace with'),
  })
  .describe('Replace an exercise in a circuit block')

const workoutChangeSchema = z.union([
  replaceBlockSchema,
  addBlockSchema,
  removeBlockSchema,
  addCircuitExerciseSchema,
  removeCircuitExerciseSchema,
  replaceCircuitExerciseSchema,
])

type WorkoutChange = z.infer<typeof workoutChangeSchema>

export {
  addBlockSchema,
  addCircuitExerciseSchema,
  removeBlockSchema,
  removeCircuitExerciseSchema,
  replaceBlockSchema,
  replaceCircuitExerciseSchema,
  workoutChangeSchema,
  type WorkoutChange,
}
