import { z } from "zod"

export const evaluatePromptRequestSchema = z.object({
  systemPrompt: z
    .string()
    .min(1, "System prompt is required")
    .max(50_000, "System prompt is too long"),
})

export type EvaluatePromptRequest = z.infer<typeof evaluatePromptRequestSchema>
