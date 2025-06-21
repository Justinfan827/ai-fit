import { openai } from '@ai-sdk/openai'
import { convertToCoreMessages, streamText } from 'ai'
import { z } from 'zod'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
})

const requestSchema = z.object({
  messages: z.array(messageSchema),
  clientContext: z
    .object({
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
    .optional(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { messages, clientContext } = requestSchema.parse(body)

    // Create system prompt with client context
    const systemPrompt = `You are a fitness expert and applied biomechanics specialist helping to design personalized workout programs. You're having a conversation with a trainer about their client.

${
  clientContext
    ? `
Current Client Context:
- Name: ${clientContext.firstName}
- Age: ${clientContext.age || 'Not specified'}
- Weight: ${clientContext.weightKg ? `${clientContext.weightKg} kg` : 'Not specified'}
- Height: ${clientContext.heightCm ? `${clientContext.heightCm} cm` : 'Not specified'}
- Lifting Experience: ${clientContext.liftingExperienceMonths ? `${clientContext.liftingExperienceMonths} months` : 'Not specified'}
- Gender: ${clientContext.gender || 'Not specified'}

Client Details:
${
  clientContext.details
    ?.map((detail) => `- ${detail.title}: ${detail.description}`)
    .join('\n') || 'No additional details provided'
}
`
    : 'No client context provided.'
}

You should:
1. Provide expert fitness advice tailored to this specific client
2. Ask clarifying questions when needed to better understand their goals
3. Suggest specific exercises, rep ranges, and training approaches
4. Consider their experience level, physical limitations, and goals
5. Keep conversations focused on fitness and training

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
