import {
  convertToCoreMessages,
  createDataStream,
  type DataStreamWriter,
  streamText,
} from "ai"
import { buildSystemPrompt } from "@/lib/ai/prompts/prompts"
import { myProvider } from "@/lib/ai/providers"
import { updateWorkoutProgram } from "@/lib/ai/tools/update-workout-program"
import log from "@/lib/logger/logger"
import { sendDebugLog } from "@/lib/supabase/server/database.operations.mutations"
import { requestSchema } from "./schema"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { messages, contextItems = [], workouts } = requestSchema.parse(body)
    const systemPrompt = buildSystemPrompt(contextItems, workouts)
    const coreMessages = convertToCoreMessages(messages)
    log.consoleWithHeader("System prompt", systemPrompt)
    const stream = createDataStream({
      execute: (dataStream: DataStreamWriter) => {
        try {
          const result = streamText({
            model: myProvider.languageModel("chat-model"),
            system: systemPrompt,
            messages: coreMessages,
            tools: {
              updateWorkoutProgram: updateWorkoutProgram({
                contextItems,
                existingWorkouts: workouts,
                dataStream,
              }),
            },
            maxSteps: 3,
            onFinish: async ({ request, text }) => {
              await sendDebugLog(JSON.parse(request?.body || "{}"), text)
            },
            onError: (error) => log.error("Stream error:", error),
          })
          result.mergeIntoDataStream(dataStream)
        } catch (error) {
          log.error("Stream error:", error)
        }
      },
    })
    return new Response(stream)
  } catch (error) {
    log.error("Chat API Error:", { error })
    return Response.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    )
  }
}
