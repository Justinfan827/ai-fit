import {
  buildDiffGenerationPrompt,
  buildSystemPrompt,
  buildWorkoutModificationPrompt,
} from '@/lib/ai/prompts/prompts'
import { workoutsSchema } from '@/lib/domain/workouts'
import { aiWorkoutDiffSchema } from '@/lib/types/workout-diff'
import { openai } from '@ai-sdk/openai'
import {
  convertToCoreMessages,
  generateObject,
  generateText,
  streamObject,
  streamText,
} from 'ai'
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

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { messages, contextItems = [], workouts } = requestSchema.parse(body)

    const lastMessage = messages[messages.length - 1]

    // Step 1: Classify intent
    const { object: intent } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: intentSchema,
      prompt: `Classify this user message in the context of fitness coaching:
      
Message: "${lastMessage.content}"

Context: The user is a fitness coach working with a client program that contains ${workouts.length} workout(s).

Determine if this is:
- "general": Questions about the program, client info, exercises, or general fitness advice
- "workout_modification": Requests to edit, modify, add, or remove exercises/sets/reps from workouts

If it's a workout modification, identify what they want to change.`,
    })

    // Build system prompt
    const systemPrompt = buildSystemPrompt(contextItems, workouts)

    // Step 2: Route based on intent
    if (intent.type === 'general') {
      // General chat - use existing streaming approach
      const result = streamText({
        model: openai('gpt-4o-mini'),
        system: systemPrompt,
        messages: convertToCoreMessages(messages),
        maxTokens: 1000,
        temperature: 0.7,
        onFinish: async ({ response }) => {
          console.log(
            'General chat response:',
            JSON.stringify(response.messages, null, 2)
          )
        },
      })

      return result.toDataStreamResponse()
    } else {
      console.log('Processing workout modification with 2-step approach...')

      const { text: updatedWorkoutText } = await generateText({
        model: openai('gpt-4o'),
        system: buildWorkoutModificationPrompt(contextItems, workouts),
        prompt: `Please modify the workout program based on this request: "${lastMessage.content}"`,
        maxTokens: 2000,
        temperature: 0.3,
      })

      console.log('Updated workout text:', updatedWorkoutText)

      // Step 2: Convert text changes to structured diff
      const result = streamObject({
        model: openai('gpt-4o'),
        schema: aiWorkoutDiffSchema,
        system: buildDiffGenerationPrompt(
          workouts,
          updatedWorkoutText,
          contextItems
        ),
        prompt: `Analyze the workout changes and generate a structured diff.`,
        onFinish: async ({ response }) => {
          console.log('Generated diff:', JSON.stringify(response, null, 2))
        },
      })

      // Return structured response
      return result.toTextStreamResponse()
    }
  } catch (error) {
    console.error('Chat API Error:', error)
    return Response.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    )
  }
}
