import { z } from 'zod'

export const exerciseSchema = z.object({
  id: z.string().uuid(), // Validates a UUID string
  exercise_name: z.string(),
  sets: z.string(), // Assuming `sets` is a string (e.g., "3")
  reps: z.string(), // Assuming `reps` is a string (e.g., "10")
  weight: z.string(), // Assuming `weight` is a string (e.g., "135")
  rest: z.string(), // Assuming `rest` is a string (e.g., "60")
  notes: z.string(),
})

export const workoutSchema = z.object({
  id: z.string().uuid(), // Validates a UUID string
  program_id: z.string().uuid(), // Validates a UUID string
  name: z.string(),
  blocks: z.array(exerciseSchema), // Array of exercises
})

export const workoutsSchema = z.array(workoutSchema)

export const programSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
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
  // supabase times are offset 0 at UTC
  start_at: z.string().datetime({ offset: true }).nullable(),
  end_at: z.string().datetime({ offset: true }).nullable(),
  workout_name: z.string(),
  workout_id: z.string().uuid(),
  blocks: z.array(workoutInstanceBlockSchema),
})

export type WorkoutInstanceBlock = z.infer<typeof workoutInstanceBlockSchema>
export type WorkoutInstance = z.infer<typeof workoutInstanceSchema>
export type Workouts = z.infer<typeof workoutsSchema>
export type Workout = z.infer<typeof workoutSchema>
export type Exercise = z.infer<typeof exerciseSchema>
export type Program = z.infer<typeof programSchema>
export type ExerciseInstance = z.infer<typeof exerciseInstanceSchema>
