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

    // Build context sections
    const contextSections: string[] = []

    contextItems.forEach((item) => {
      if (item.type === 'client') {
        const clientData = item.data as z.infer<typeof clientContextSchema>
        contextSections.push(`
Current Client Context:
- Name: ${clientData.firstName}
- Age: ${clientData.age || 'Not specified'}
- Weight: ${clientData.weightKg ? `${clientData.weightKg} kg` : 'Not specified'}
- Height: ${clientData.heightCm ? `${clientData.heightCm} cm` : 'Not specified'}
- Lifting Experience: ${clientData.liftingExperienceMonths ? `${clientData.liftingExperienceMonths} months` : 'Not specified'}
- Gender: ${clientData.gender || 'Not specified'}

Client Details:
${
  clientData.details
    ?.map((detail) => `- ${detail.title}: ${detail.description}`)
    .join('\n') || 'No additional details provided'
}`)
      } else if (item.type === 'exercises') {
        const exerciseData = item.data as {
          exercises: z.infer<typeof exerciseContextSchema>[]
          title?: string
        }
        contextSections.push(`
${exerciseData.title || "Trainer's Preferred Exercises"}:
${exerciseData.exercises
  .map(
    (exercise) =>
      `- ${exercise.name}${exercise.category ? ` (${exercise.category})` : ''}${exercise.equipment ? ` - ${exercise.equipment}` : ''}`
  )
  .join('\n')}`)
      }
    })

    // Create system prompt with available context
    const systemPrompt = `You are a fitness expert and applied biomechanics specialist helping to design personalized workout programs. You're having a conversation with a trainer.

${contextSections.length > 0 ? contextSections.join('\n\n') : 'No specific context provided - you can help with general fitness advice and program design.'}

You should:
1. Provide expert fitness advice${contextItems.some((item) => item.type === 'client') ? ' tailored to the specific client' : ''}
2. Ask clarifying questions when needed to better understand goals and requirements
3. Suggest specific exercises, rep ranges, and training approaches
4. Consider experience levels, physical limitations, and goals when provided
5. Keep conversations focused on fitness and training
${contextItems.some((item) => item.type === 'exercises') ? '6. Prioritize using the provided preferred exercises when creating programs' : ''}

Be conversational, helpful, and professional. If asked to generate a workout program, guide the trainer through the process by asking about specific parameters like workout frequency, session duration, and primary goals.`

    const result = await streamText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      messages: convertToCoreMessages(messages),
      maxTokens: 1000,
      temperature: 0.7,
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
