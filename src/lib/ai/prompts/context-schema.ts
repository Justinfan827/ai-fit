import { z } from "zod"

const clientContextDataSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  age: z.number().optional(),
  weightKg: z.number().optional(),
  heightCm: z.number().optional(),
  liftingExperienceMonths: z.number().optional(),
  gender: z.string().optional(),
  details: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
      })
    )
    .optional(),
})

const exerciseContextDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string().optional(),
  equipment: z.string().optional(),
  muscleGroups: z.array(z.string()).optional(),
})

const exercisesContextDataSchema = z.object({
  exercises: z.array(exerciseContextDataSchema),
  title: z.string().optional(),
})

const clientContextSchema = z.object({
  type: z.literal("client"),
  data: clientContextDataSchema,
})

const exercisesContextSchema = z.object({
  type: z.literal("exercises"),
  data: exercisesContextDataSchema,
})

const contextItemSchema = z.union([clientContextSchema, exercisesContextSchema])

type ContextItem = z.infer<typeof contextItemSchema>
type ClientContextData = z.infer<typeof clientContextDataSchema>
type ExercisesContextData = z.infer<typeof exercisesContextDataSchema>

export {
  type ContextItem,
  type ClientContextData,
  type ExercisesContextData,
  clientContextSchema,
  exercisesContextSchema,
  contextItemSchema,
}
