import { z } from 'zod'

// exercises that are stored in the DB
export const exerciseSchema = z.object({
  id: z.string().uuid(), // Validates a UUID string
  name: z.string(),
  muscleGroup: z.string(),
  ownerId: z.string().uuid().nullable(),
})

export const exercisesSchema = z.array(exerciseSchema)

export const workoutExerciseSchema = z.object({
  id: z.string().uuid(), // Validates a UUID string
  exercise_name: z.string(),
  sets: z.string(), // Assuming `sets` is a string (e.g., "3")
  reps: z.string(), // Assuming `reps` is a string (e.g., "10")
  weight: z.string(), // Assuming `weight` is a string (e.g., "135")
  rest: z.string(), // Assuming `rest` is a string (e.g., "60")
  notes: z.string(),
})

const exerciseBlockSchema = z.object({
  type: z.literal('exercise'),
  exercise: z.object({
    id: z.string().uuid(),
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

const circuitBlockSchema = z.object({
  type: z.literal('circuit'),
  circuit: z.object({
    isDefault: z.boolean(),
    name: z.string(),
    description: z.string(),
    metadata: z.object({
      sets: z.string(),
      rest: z.string(),
      notes: z.string(),
    }),
    exercises: z.array(exerciseBlockSchema),
  }),
})

const blockSchema = exerciseBlockSchema.or(circuitBlockSchema)

export const workoutSchema = z.object({
  id: z.string().uuid(), // Validates a UUID string
  program_order: z.number(),
  week: z.number().optional(),
  program_id: z.string().uuid(), // Validates a UUID string
  name: z.string(),
  blocks: z.array(blockSchema), // Array of exercises
})

export const aiExerciseSchema = z.object({
  exercise_name: z.string(),
  sets: z.string(), // Assuming `sets` is a string (e.g., "3")
  reps: z.string(), // Assuming `reps` is a string (e.g., "10")
  weight: z.string(), // Assuming `weight` is a string (e.g., "135")
  rest: z.string(), // Assuming `rest` is a string (e.g., "60")
  notes: z.string(),
})

export const aiWorkoutSchema = z.object({
  name: z.string(),
  blocks: z.array(aiExerciseSchema), // Array of exercises
})

export const aiProgramSchema = z.object({
  workouts: z.array(aiWorkoutSchema),
})

export const workoutsSchema = z.array(workoutSchema)

export const programSchema = z.object({
  id: z.string().uuid(),
  created_at: z.string().datetime({ offset: true }),
  name: z.string(),
  type: z.enum(['weekly', 'splits']),
  workouts: z.array(workoutSchema),
})

export const exerciseInstanceSetSchema = z.object({
  planned: z.object({
    reps: z.string(),
    rest: z.string(),
    notes: z.string(),
    weight: z.string(),
  }),
  actual: z.object({
    reps: z.string(),
    rest: z.string(),
    notes: z.string(),
    weight: z.string(),
  }),
})

export const exerciseInstanceSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  sets: z.array(exerciseInstanceSetSchema),
})

export const workoutInstanceBlockSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['exercise']),
  exercise: exerciseInstanceSchema,
})

export const workoutInstanceSchema = z.object({
  id: z.string().uuid(),
  workoutId: z.string().uuid(),
  userId: z.string().uuid(),
  programId: z.string().uuid(),
  // supabase times are offset 0 at UTC
  startAt: z.string().datetime({ offset: true }).nullable(),
  endAt: z.string().datetime({ offset: true }).nullable().optional(),
  blocks: z.array(workoutInstanceBlockSchema),
})

export type WorkoutInstanceBlock = z.infer<typeof workoutInstanceBlockSchema>
export type WorkoutInstance = z.infer<typeof workoutInstanceSchema>
export type Workouts = z.infer<typeof workoutsSchema>
export type Workout = z.infer<typeof workoutSchema>
export type WorkoutExercise = z.infer<typeof workoutExerciseSchema>
export type Exercise = z.infer<typeof exerciseSchema>
export type ExerciseBlockSchema = z.infer<typeof exerciseBlockSchema>
export type Program = z.infer<typeof programSchema>
export type ExerciseInstance = z.infer<typeof exerciseInstanceSchema>

// types just for AI generation (no id's primarily)
export type AIWorkout = z.infer<typeof aiWorkoutSchema>
export type AIProgram = z.infer<typeof aiProgramSchema>
