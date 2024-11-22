import { z } from "zod";

// Column configuration
const columnSchema = z.object({
  type: z.enum(["sets", "reps", "weight", "rpe", "rest", "notes"]),
  units: z.string().optional(), // e.g. "lb" for weight
});

// Core exercise metadata (sets, reps, weight, etc.)
const metadataSchema = z.object({
  type: z.enum(["sets", "reps", "weight", "rpe", "rest", "notes"]),
  value: z.string(),
  units: z.string().optional(), // Only used for weight
});

// Basic exercise definition
const exerciseSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().optional(),
  focus: z.string().optional(),
});

// Exercise within a workout
const workoutExerciseSchema = z.object({
  id: z.number(),
  type: z.enum(["exercise", "circuit", "warmup"]),
  exercise: exerciseSchema.nullable(),
  exercise_name: z.string(),
  metadata: z.array(metadataSchema),
  notes: z.string().optional(),
});

// Complete workout schema
const workoutSchema = z.object({
  id: z.number(),
  name: z.string(),
  columns: z.array(columnSchema),
  exercises: z.array(workoutExerciseSchema),
  notes: z.string().optional(),
});

// Type definitions with capital letters
type Column = z.infer<typeof columnSchema>;
type Metadata = z.infer<typeof metadataSchema>;
type Exercise = z.infer<typeof exerciseSchema>;
type WorkoutExercise = z.infer<typeof workoutExerciseSchema>;
type Workout = z.infer<typeof workoutSchema>;

export {
  // Zod schemas (lowercase)
  workoutSchema,
  workoutExerciseSchema,
  exerciseSchema,
  metadataSchema,
  columnSchema,

  // TypeScript types (uppercase)
  type Workout,
  type WorkoutExercise,
  type Exercise,
  type Metadata,
  type Column,
};
