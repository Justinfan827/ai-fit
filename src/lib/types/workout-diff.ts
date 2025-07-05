import { z } from 'zod'

// Base change types that represent modifications to the workout grid
export const cellChangeSchema = z.object({
  type: z.literal('cell'),
  workoutId: z.string(),
  blockIndex: z.number(),
  exerciseIndex: z.number().optional(), // undefined for exercise blocks, defined for circuit blocks
  field: z.enum(['sets', 'reps', 'weight', 'rest', 'notes']),
  oldValue: z.string().optional(),
  newValue: z.string(),
})

export const exerciseSelectionSchema = z.object({
  type: z.literal('exercise'),
  workoutId: z.string(),
  blockIndex: z.number(),
  exerciseIndex: z.number().optional(), // undefined for exercise blocks, defined for circuit blocks
  oldExerciseId: z.string().optional(),
  newExerciseId: z.string(),
})

export const blockAddSchema = z.object({
  type: z.literal('block_add'),
  workoutId: z.string(),
  blockIndex: z.number(),
  blockData: z.any(), // The actual block data - you'll need to import the proper Block type
})

export const blockRemoveSchema = z.object({
  type: z.literal('block_remove'),
  workoutId: z.string(),
  blockIndex: z.number(),
})

// Union of all possible grid changes
export const gridChangeSchema = z.union([
  cellChangeSchema,
  exerciseSelectionSchema,
  blockAddSchema,
  blockRemoveSchema,
])

// Main workout diff schema
export const workoutDiffSchema = z.object({
  id: z.string(), // uuid for reference
  changes: z.array(gridChangeSchema), // incremental changes
  summary: z.string().optional(), // short natural-language description
})

export const gridDiffSchema = z.array(gridChangeSchema)
// AI schema to pass to LLM
export const aiWorkoutDiffSchema = z.object({
  diff: gridDiffSchema,
  summary: z.string(),
})

export type GridDiff = z.infer<typeof gridDiffSchema>
export type AiWorkoutDiff = z.infer<typeof aiWorkoutDiffSchema>

// Export types
export type CellChange = z.infer<typeof cellChangeSchema>
export type ExerciseSelection = z.infer<typeof exerciseSelectionSchema>
export type BlockAdd = z.infer<typeof blockAddSchema>
export type BlockRemove = z.infer<typeof blockRemoveSchema>
export type GridChange = z.infer<typeof gridChangeSchema>
export type WorkoutDiff = z.infer<typeof workoutDiffSchema>

// Response shape for diff mode
export const diffResponseSchema = z.object({
  diff: workoutDiffSchema,
  assistantMessage: z.string(),
})

export type DiffResponse = z.infer<typeof diffResponseSchema>
