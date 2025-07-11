import { openai } from "@ai-sdk/openai"
import {
  convertToCoreMessages,
  createDataStream,
  type DataStreamWriter,
  streamText,
} from "ai"
import { buildSystemPrompt } from "@/lib/ai/prompts/prompts"
import { createWorkoutChanges } from "@/lib/ai/tools/create-workout-changes"
import { requestSchema } from "./schema"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { messages, contextItems = [], workouts } = requestSchema.parse(body)
    const systemPrompt = buildSystemPrompt(contextItems, workouts)
    const coreMessages = convertToCoreMessages(messages)
    const lastMessage = messages[messages.length - 1]

    //     // Step 1: Classify intent
    //     const { object: intent } = await generateObject({
    //       model: openai('gpt-4o-mini'),
    //       schema: intentSchema,
    //       prompt: `Classify this user message in the context of fitness coaching:

    // Message: "${lastMessage.content}"

    // Context: The user is a fitness coach working with a client program that contains ${workouts.length} workout(s).

    // Determine if this is:
    // - "general": Questions about the program, client info, exercises, or general fitness advice
    // - "workout_modification": Requests to edit, modify, add, or remove exercises/sets/reps from workouts

    // If it's a workout modification, identify what they want to change.`,
    //     })

    // Build system prompt
    console.log("System prompt:")
    console.log("--------------------------------")
    console.log(systemPrompt)
    console.log("--------------------------------")
    console.log("Last message:")
    console.log("--------------------------------")
    console.log(lastMessage.content)
    console.log("--------------------------------")
    console.log("Core messages:")
    console.log("--------------------------------")
    console.log(coreMessages)
    console.log("--------------------------------")

    const stream = createDataStream({
      execute: async (dataStream: DataStreamWriter) => {
        try {
          const result = streamText({
            model: openai("gpt-4o-mini"),
            system: systemPrompt,
            messages: coreMessages,
            tools: {
              createWorkoutChanges: createWorkoutChanges({
                messages: coreMessages,
                contextItems,
                existingWorkouts: workouts,
                dataStream,
              }),
            },
            maxSteps: 3,
            onFinish: async ({ steps }) => {
              console.log("--------------------------------")
              console.log("On finish steps:")
              console.log("--------------------------------")
              console.log(JSON.stringify(steps, null, 2))
              console.log("--------------------------------")
            },
            onError: (error) => {
              console.log("--------------------------------")
              console.log("Error:")
              console.log("--------------------------------")
              console.log(error)
              console.log("--------------------------------")
            },
          })
          result.mergeIntoDataStream(dataStream)
        } catch (error) {
          console.log("--------------------------------")
          console.log("Stream error:")
          console.log("--------------------------------")
          console.log(JSON.stringify(error, null, 2))
          console.log("--------------------------------")
        }
      },
    })
    return new Response(stream)
  } catch (error) {
    console.error("Chat API Error:", error)
    return Response.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    )
  }
}
