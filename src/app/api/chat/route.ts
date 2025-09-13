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
          // If the last message is from the user:
          // Create a new "start step" to begin streaming the AI's response data.
          //
          // If the last message is from the assistant:
          // Don't create a new step - instead, add any new
          // data (like tool results) to the existing step.
          //
          // This ensures user messages always trigger new conversation steps,
          // while assistant messages and their follow-up data (tool calls,
          // results, etc.) stay grouped together in the same step.
          //
          // More info on the data stream protocol here:
          // - https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol#message-start-part
          if (message.role === "user") {
            writer.write({
              type: "start",
              messageId: uuidv4(),
            })
            // TODO: do I need this? I'm seeing dupes in the DB
            // writer.write({
            //   type: "start-step",
            // })
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
