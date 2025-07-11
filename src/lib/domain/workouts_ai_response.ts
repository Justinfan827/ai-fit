/*
 * Testing out a program schema that
 * the ai will generate
 */

import { z } from "zod"

const exerciseBlockSchema = z.object({
  type: z.literal("exercise"),
  exercise: z.object({
    id: z.string().describe("uuid string for this exercise"),
    name: z.string(),
    metadata: z.object({
      sets: z.string(),
      reps: z.string(),
      weight: z.string(),
      rest: z.string(),
    }),
  }),
})

const circuitBlockSchema = z.object({
  type: z.literal("circuit"),
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

const workoutSchema = z.object({
  name: z.string().describe("Name of the workout"),
  blocks: z.array(blockSchema).describe("Individual blocks of the workout"),
})

// This zod schema has certain restrictions! This
// https://platform.openai.com/docs/guides/structured-outputs?api-mode=responses
const generateProgramSchema = z.object({
  workouts: z.array(workoutSchema).describe("Array of workouts"),
})

type GenerateProgramSchema = z.infer<typeof generateProgramSchema>

export {
  blockSchema,
  circuitBlockSchema,
  exerciseBlockSchema,
  generateProgramSchema,
  workoutSchema,
  type GenerateProgramSchema,
}
