import z from "zod"

// Define exercise block schema that can have pending status
export const aiExerciseBlockSchema = z.object({
  type: z.literal("exercise"),
  exercise: z.object({
    id: z.uuid(),
    name: z.string(),
    metadata: z.object({
      sets: z.string(),
      reps: z.string(),
      weight: z.string(),
      rest: z.string(),
      notes: z.string().optional(),
    }),
  }),
})

// Define circuit block schema
export const aiCircuitBlockSchema = z.object({
  type: z.literal("circuit"),
  circuit: z.object({
    name: z.string(),
    description: z.string(),
    metadata: z.object({
      sets: z.string(),
      rest: z.string(),
      notes: z.string(),
    }),
    exercises: z.array(aiExerciseBlockSchema),
  }),
})

// Define block schema
export const aiBlockSchema = aiExerciseBlockSchema.or(aiCircuitBlockSchema)

export const aiWorkoutSchema = z.object({
  blocks: z.array(aiBlockSchema),
})

export const aiProgramSchema = z.object({
  workouts: z.array(aiWorkoutSchema),
})

export type AIBlock = z.infer<typeof aiBlockSchema>
export type AIExerciseBlock = z.infer<typeof aiExerciseBlockSchema>
export type AICircuitBlock = z.infer<typeof aiCircuitBlockSchema>
