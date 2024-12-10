import { z } from 'zod'

const exerciseSchema = z.object({
  exercise_name: z.string(),
  sets: z.string(), // Assuming `sets` is a string (e.g., "3")
  reps: z.string(), // Assuming `reps` is a string (e.g., "10")
  weight: z.string(), // Assuming `weight` is a string (e.g., "135")
  rest: z.string(), // Assuming `rest` is a string (e.g., "60")
  notes: z.string(),
})

const workoutSchema = z.object({
  id: z.string().uuid(), // Validates a UUID string
  name: z.string(),
  rows: z.array(exerciseSchema), // Array of exercises
})

const workoutsSchema = z.array(workoutSchema)

const programSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  workouts: z.array(workoutSchema),
})

const exerciseInstanceSetSchema = z.object({
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

const exerciseInstanceSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  sets: z.array(exerciseInstanceSetSchema),
})

const workoutInstanceBlockSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['exercise']),
  exercise: exerciseInstanceSchema,
})

const workoutInstanceSchema = z.object({
  id: z.string().uuid(),
  workout_id: z.string().uuid(),
  blocks: z.array(workoutInstanceBlockSchema),
})

type WorkoutInstanceBlock = z.infer<typeof workoutInstanceBlockSchema>
type WorkoutInstance = z.infer<typeof workoutInstanceSchema>
type Workouts = z.infer<typeof workoutsSchema>
type Workout = z.infer<typeof workoutSchema>
type Exercise = z.infer<typeof exerciseSchema>
type Program = z.infer<typeof programSchema>

export {
  exerciseSchema,
  programSchema,
  workoutInstanceBlockSchema,
  workoutInstanceSchema,
  workoutSchema,
  workoutsSchema,
  type Exercise,
  type Workout,
  type WorkoutInstance,
  type WorkoutInstanceBlock,
  type Program,
  type Workouts,
}
