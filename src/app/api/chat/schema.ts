import { workoutsSchema } from '@/lib/domain/workouts'
import { z } from 'zod'

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
})

const clientContextSchema = z.object({
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

const exerciseContextSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string().optional(),
  equipment: z.string().optional(),
  muscleGroups: z.array(z.string()).optional(),
})

const contextItemSchema = z.object({
  type: z.enum(['client', 'exercises']),
  data: z.union([
    clientContextSchema,
    z.object({
      exercises: z.array(exerciseContextSchema),
      title: z.string().optional(),
    }),
  ]),
})

const requestSchema = z.object({
  messages: z.array(messageSchema),
  contextItems: z.array(contextItemSchema).optional(),
  workouts: workoutsSchema,
})

// Intent classification schema
const intentSchema = z.object({
  type: z.enum(['general', 'workout_modification']),
  reasoning: z.string(),
  modificationDetails: z
    .object({
      targetWorkout: z.string().optional(),
      requestedChanges: z.array(z.string()).optional(),
    })
    .optional(),
})

export { contextItemSchema, intentSchema, messageSchema, requestSchema }
