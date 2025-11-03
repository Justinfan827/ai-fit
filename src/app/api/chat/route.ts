import { auth } from "@clerk/nextjs/server"
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
} from "ai"
import { ConvexHttpClient } from "convex/browser"
import { after, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { buildSystemPrompt } from "@/lib/ai/prompts/prompts"
import { gatewayProviders } from "@/lib/ai/providers"
import type { MyUIMessage } from "@/lib/ai/ui-message-types"
import { myTools } from "@/lib/ai/ui-message-types"
import log from "@/lib/logger/logger"
import { requestSchema } from "./schema"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  try {
    // Use Clerk's auth() helper for App Router route handlers
    const { getToken, isAuthenticated } = await auth()

    // Protect the route by checking if the user is signed in
    if (!isAuthenticated) {
      log.error("Unauthorized request - user not authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse and validate request body
    const body = await req.json()
    const parsedBody = requestSchema.safeParse(body)
    if (!parsedBody.success) {
      log.error("Invalid request body", parsedBody.error)
      return NextResponse.json(
        { error: "Invalid request body", details: parsedBody.error },
        { status: 400 }
      )
    }

    const {
      message,
      contextItems = [],
      workouts,
      programId,
      chatId,
    } = parsedBody.data

    log.consoleWithHeader("Chat persistence request", {
      programId,
      chatId: chatId || "new",
    })

    // Get Clerk auth token for Convex with correct audience
    const token = await getToken({ template: "convex" })
    if (!token) {
      log.error("Failed to get Clerk token for Convex")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Create Convex HTTP client with auth token
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
    if (!convexUrl) {
      log.error("Convex URL not configured")
      return NextResponse.json(
        { error: "Convex URL not configured" },
        { status: 500 }
      )
    }
    const convexClient = new ConvexHttpClient(convexUrl)
    convexClient.setAuth(token)

    // programId is already a Convex ID string, cast to proper type
    const programIdAsId = programId as Id<"programs">

    // Get or create chat for this program
    // chatId can be either a Convex ID string (from previous response) or undefined
    let resolvedChatId: Id<"chats">
    try {
      resolvedChatId = chatId
        ? (chatId as Id<"chats">)
        : await convexClient.mutation(api.chats.getOrCreateProgramChat, {
            programId: programIdAsId,
          })
      log.consoleWithHeader("Resolved chat ID", resolvedChatId)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      const errorDetails =
        error instanceof Error
          ? { message: error.message, name: error.name, stack: error.stack }
          : { error }
      log.error("Failed to get or create program chat", {
        error: errorDetails,
        errorMessage,
        programId,
      })
      return NextResponse.json(
        {
          error: "Failed to get or create program chat",
          details: errorMessage,
        },
        { status: 500 }
      )
    }

    // Upsert the incoming user message immediately
    try {
      await convexClient.mutation(api.chats.upsertMessage, {
        chatId: resolvedChatId,
        messageId: message.id,
        role: message.role,
        metadata: message.metadata,
        parts: message.parts,
      })
      log.consoleWithHeader("Upserted user message", message.id)
    } catch (error) {
      log.error("Failed to upsert user message", {
        error,
        messageId: message.id,
      })
      throw error
    }

    // Load all previous messages from database for context
    let messages: MyUIMessage[]
    try {
      messages = await convexClient.query(api.chats.loadChatMessages, {
        chatId: resolvedChatId,
      })
      log.consoleWithHeader("Loaded messages", { count: messages.length })
    } catch (error) {
      log.error("Failed to load chat messages", {
        error,
        chatId: resolvedChatId,
      })
      throw error
    }

    // Build system prompt
    const systemPrompt = buildSystemPrompt(contextItems, workouts)
    const modelMessages = convertToModelMessages(messages)

    // Store system prompt for debugging (async, non-blocking)
    after(async () => {
      try {
        // Create a new client instance for the after() callback
        // since the original client might not be available in this context
        const { getToken: getAfterToken } = await auth()
        const afterClient = new ConvexHttpClient(convexUrl)
        const afterToken = await getAfterToken({ template: "convex" })
        if (afterToken) {
          afterClient.setAuth(afterToken)
          await afterClient.mutation(api.chats.createSystemPrompt, {
            content: systemPrompt,
          })
        }
      } catch (error) {
        log.error("Failed to log system prompt:", error)
      }
    })
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
          }

          const result = streamText({
            model: gatewayProviders["chat-model"],
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
          // Create a new client instance for the onFinish callback
          // to ensure auth token is still valid
          const { getToken: getFinishToken } = await auth()
          const finishClient = new ConvexHttpClient(convexUrl)
          const finishToken = await getFinishToken({ template: "convex" })
          if (!finishToken) {
            log.error("Failed to get token in onFinish callback")
            return
          }
          finishClient.setAuth(finishToken)
          await finishClient.mutation(api.chats.upsertMessage, {
            chatId: resolvedChatId,
            messageId: responseMessage.id,
            role: responseMessage.role,
            metadata: responseMessage.metadata,
            parts: responseMessage.parts,
          })
        } catch (error) {
          log.error("Failed to persist AI response:", error)
        }
      },
    })

    return createUIMessageStreamResponse({ stream })
  } catch (error) {
    log.error("Chat API Error:", { error })
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    )
  }
}
