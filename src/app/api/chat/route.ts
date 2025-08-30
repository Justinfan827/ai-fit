import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
} from "ai"
import { buildSystemPrompt } from "@/lib/ai/prompts/prompts"
import { myProvider } from "@/lib/ai/providers"
import { type MyUIMessage, myTools } from "@/lib/ai/ui-message-types"
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
    const modelMessages = convertToModelMessages(messages as MyUIMessage[])
    log.consoleWithHeader("System prompt", systemPrompt)
    const stream = createUIMessageStream<MyUIMessage>({
      execute: ({ writer }) => {
        try {
          const result = streamText({
            model: myProvider.languageModel("chat-model"),
            system: systemPrompt,
            messages: modelMessages,
            tools: myTools({
              contextItems,
              existingWorkouts: workouts,
              writer,
            }),
            stopWhen: stepCountIs(4),
            onFinish: async ({ request, text }) => {
              await sendDebugLog(
                request?.body ? JSON.parse(request.body as string) : {},
                text
              )
            },
            onError: (error) => log.error("Stream error:", error),
          })
          writer.merge(result.toUIMessageStream())
        } catch (error) {
          log.error("Stream error:", error)
        }
      },
    })
    return createUIMessageStreamResponse({ stream })
  } catch (error) {
    log.error("Chat API Error:", { error })
    return Response.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    )
  }
}
