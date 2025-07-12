import { z } from "zod"
import { contextItemSchema } from "@/lib/ai/prompts/context-schema"
import { workoutsSchema } from "@/lib/domain/workouts"

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
})

const requestSchema = z.object({
  messages: z.array(messageSchema),
  contextItems: z.array(contextItemSchema).optional(),
  workouts: workoutsSchema,
})

export { messageSchema, requestSchema }
