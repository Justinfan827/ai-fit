import { z } from "zod"
import { clientDetailedSchema } from "@/lib/domain/clients"

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
  data: clientDetailedSchema,
})

const exercisesContextSchema = z.object({
  type: z.literal("exercises"),
  data: exercisesContextDataSchema,
})

const contextItemSchema = z.union([clientContextSchema, exercisesContextSchema])

type ContextItem = z.infer<typeof contextItemSchema>
type ExercisesContextData = z.infer<typeof exercisesContextDataSchema>

export {
  type ContextItem,
  type ExercisesContextData,
  clientContextSchema,
  exercisesContextSchema,
  contextItemSchema,
}
