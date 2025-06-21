import { buildSystemPrompt } from '@/lib/ai/prompts/prompts'
import { openai } from '@ai-sdk/openai'
import { convertToCoreMessages, streamText } from 'ai'
import { z } from 'zod'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

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
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { messages, contextItems = [] } = requestSchema.parse(body)

    // Build system prompt using helper from prompts.ts
    const systemPrompt = buildSystemPrompt(contextItems)

    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      messages: convertToCoreMessages(messages),
      maxTokens: 1000,
      temperature: 0.7,
      onFinish: async ({ response }) => {
        console.log(JSON.stringify(response.messages, null, 2))
      },
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error('Chat API Error:', error)
    return Response.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    )
  }
}
