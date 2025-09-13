import { z } from "zod"
import { contextItemSchema } from "@/lib/ai/prompts/context-schema"
import { workoutsSchema } from "@/lib/domain/workouts"

// Schema for individual UIMessage (following AI SDK patterns)
const uiMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant", "system"]),
  metadata: z.any().optional(),
  parts: z.array(z.any()), // UIMessage parts array (text, tool calls, files, etc.)
})

// Updated request schema for chat persistence
// Following AI SDK optimization: only send the last message
const requestSchema = z.object({
  message: uiMessageSchema, // Single message instead of array
  contextItems: z.array(contextItemSchema).optional(),
  workouts: workoutsSchema,
  // New fields for chat persistence
  programId: z.string().uuid(),
  chatId: z.string().uuid().optional(), // Optional for new chats
})

export { requestSchema, uiMessageSchema }
