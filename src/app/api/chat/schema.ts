import { z } from "zod"
import { contextItemSchema } from "@/lib/ai/prompts/context-schema"
import { workoutsSchema } from "@/lib/domain/workouts"

const requestSchema = z.object({
  messages: z.array(z.any()), // TODO:use UIMessageSchema from ai/zod?
  contextItems: z.array(contextItemSchema).optional(),
  workouts: workoutsSchema,
})

export { requestSchema }
