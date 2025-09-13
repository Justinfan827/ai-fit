import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
} from "ai"
import { v4 as uuidv4 } from "uuid"
import { buildSystemPrompt } from "@/lib/ai/prompts/prompts"
import { myProvider } from "@/lib/ai/providers"
import { type MyUIMessage, myTools } from "@/lib/ai/ui-message-types"
import log from "@/lib/logger/logger"
import {
  getOrCreateProgramChat,
  loadChatMessages,
  upsertMessage,
} from "@/lib/supabase/server/chat-operations"
import { requestSchema } from "./schema"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      message,
      contextItems = [],
      workouts,
      programId,
      chatId,
    } = requestSchema.parse(body)

    log.consoleWithHeader("Chat persistence request", {
      programId,
      chatId: chatId || "new",
    })

    // Get or create chat for this program
    const resolvedChatId = chatId || (await getOrCreateProgramChat(programId))

    // Upsert the incoming user message immediately
    await upsertMessage({
      chatId: resolvedChatId,
      id: message.id,
      message: message as MyUIMessage,
    })

    // Load all previous messages from database for context
    const messages = await loadChatMessages(resolvedChatId)

    // Build system prompt
    const systemPrompt = buildSystemPrompt(contextItems, workouts)
    const modelMessages = convertToModelMessages(messages)

    log.consoleWithHeader("System prompt", systemPrompt)
    log.consoleWithHeader(
      "Message history",
      `Loaded ${messages.length} messages`
    )

    const stream = createUIMessageStream<MyUIMessage>({
      execute: ({ writer }) => {
        try {
          // If the last message is a user message, create our own start step
          if (message.role === "user") {
            writer.write({
              type: "start",
              messageId: uuidv4(),
            })
            writer.write({
              type: "start-step",
            })
          }

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
            onError: (error) => log.error("Stream error:", error),
          })

          result.consumeStream()
          writer.merge(result.toUIMessageStream({ sendStart: false }))
        } catch (error) {
          log.error("Stream error:", error)
        }
      },
      onError: (error) => {
        log.error("UI Message Stream error:", error)
        return error instanceof Error ? error.message : String(error)
      },
      originalMessages: messages,
      onFinish: async ({ responseMessage }) => {
        try {
          log.consoleWithHeader("Persisting AI response", responseMessage.id)
          await upsertMessage({
            id: responseMessage.id,
            chatId: resolvedChatId,
            message: responseMessage,
          })
        } catch (error) {
          log.error("Failed to persist AI response:", error)
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
