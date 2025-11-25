import { v } from "convex/values"
import type { Id } from "./_generated/dataModel"
import { mutation, query } from "./_generated/server"
import { throwIfNotAuthenticated } from "./auth"

// Define message type inline (can't import from src/ in Convex)
type ChatMessage = {
  id: string
  role: "user" | "assistant" | "system"
  // TODO: full type safety from convex url to api route?
  // biome-ignore lint/suspicious/noExplicitAny: Any is used for dynamic types
  metadata?: any
  // biome-ignore lint/suspicious/noExplicitAny: Any is used for dynamic types
  parts: any
}

/**
 * Get or create the latest chat for a program.
 * If no chat exists, creates a new one and links it to the program.
 */
const getOrCreateProgramChat = mutation({
  args: {
    programId: v.id("programs"),
  },
  returns: v.id("chats"),
  handler: async (ctx, { programId }) => {
    const user = await throwIfNotAuthenticated(ctx)

    // Verify the program exists and user owns it
    const program = await ctx.db.get(programId)
    if (!program) {
      throw new Error(`Program not found: ${programId}`)
    }
    if (program.userId !== user.id) {
      throw new Error(
        "Unauthorized: You can only create chats for your own programs"
      )
    }

    // Check for existing latest chat for this program
    const existingProgramChat = await ctx.db
      .query("programChats")
      .withIndex("by_program_id_and_created_at", (q) =>
        q.eq("programId", programId)
      )
      .order("desc")
      .first()

    if (existingProgramChat) {
      return existingProgramChat.chatId
    }

    // Create new chat
    const now = new Date().toISOString()
    const chatId = await ctx.db.insert("chats", {
      userId: user.id,
      title: undefined,
      metadata: undefined,
      createdAt: now,
      updatedAt: now,
    })

    // Link chat to program
    await ctx.db.insert("programChats", {
      programId,
      chatId,
      createdAt: now,
    })

    return chatId
  },
})

/**
 * Load existing chat data for a program, including all messages.
 * Used when loading the program studio page.
 */
const getProgramChat = query({
  args: {
    programId: v.id("programs"),
  },
  returns: v.union(
    v.object({
      chatId: v.id("chats"),
      messages: v.array(
        v.object({
          id: v.string(),
          role: v.union(
            v.literal("user"),
            v.literal("assistant"),
            v.literal("system")
          ),
          metadata: v.optional(v.any()),
          parts: v.any(),
        })
      ),
    }),
    v.null()
  ),
  handler: async (ctx, { programId }) => {
    await throwIfNotAuthenticated(ctx)

    // Get the latest chat for this program
    const programChat = await ctx.db
      .query("programChats")
      .withIndex("by_program_id_and_created_at", (q) =>
        q.eq("programId", programId)
      )
      .order("desc")
      .first()

    if (!programChat) {
      return null
    }

    // Load messages for this chat
    const messages = await loadChatMessagesHelper(ctx, programChat.chatId)

    return {
      chatId: programChat.chatId,
      messages,
    }
  },
})

/**
 * Helper function to load chat messages (used internally by getProgramChat)
 */
async function loadChatMessagesHelper(
  ctx: unknown,
  chatId: Id<"chats">
): Promise<ChatMessage[]> {
  // biome-ignore lint/suspicious/noExplicitAny: Convex context type is complex
  const db = (ctx as any).db
  const messages = await db
    .query("chatMessages")
    // biome-ignore lint/suspicious/noExplicitAny: Query builder type is complex
    .withIndex("by_chat_id_and_created_at", (q: any) => q.eq("chatId", chatId))
    .order("asc")
    .collect()

  // Transform database records back to UIMessage format
  // biome-ignore lint/suspicious/noExplicitAny: Database message type is dynamic
  return messages.map((dbMessage: any) => ({
    id: dbMessage.messageId,
    role: dbMessage.role,
    metadata: dbMessage.metadata,
    parts: dbMessage.parts,
  }))
}

/**
 * Load all messages for a specific chat, ordered chronologically.
 * Transforms database records back to UIMessage format.
 */
const loadChatMessages = query({
  args: {
    chatId: v.id("chats"),
  },
  returns: v.array(
    v.object({
      id: v.string(),
      role: v.union(
        v.literal("user"),
        v.literal("assistant"),
        v.literal("system")
      ),
      metadata: v.optional(v.any()),
      parts: v.any(),
    })
  ),
  handler: async (ctx, { chatId }) => {
    await throwIfNotAuthenticated(ctx)
    return await loadChatMessagesHelper(ctx, chatId)
  },
})

/**
 * Insert or update a message in the database.
 * Uses messageId to check if message exists, then inserts or patches.
 * Also updates the chat's updatedAt timestamp.
 */
const upsertMessage = mutation({
  args: {
    chatId: v.id("chats"),
    messageId: v.string(),
    role: v.union(
      v.literal("user"),
      v.literal("assistant"),
      v.literal("system")
    ),
    metadata: v.optional(v.any()),
    parts: v.any(),
  },
  returns: v.null(),
  handler: async (ctx, { chatId, messageId, role, metadata, parts }) => {
    const user = await throwIfNotAuthenticated(ctx)

    // Verify chat ownership
    const chat = await ctx.db.get(chatId)
    if (!chat) {
      throw new Error("Chat not found")
    }
    if (chat.userId !== user.id) {
      throw new Error("Unauthorized: You can only modify your own chats")
    }

    // Check if message exists by messageId
    const existingMessage = await ctx.db
      .query("chatMessages")
      .withIndex("by_message_id", (q) => q.eq("messageId", messageId))
      .first()

    const now = new Date().toISOString()

    if (existingMessage) {
      // Update existing message
      await ctx.db.patch(existingMessage._id, {
        role,
        metadata,
        parts,
        createdAt: now, // Update timestamp on edit
      })
    } else {
      // Insert new message
      await ctx.db.insert("chatMessages", {
        chatId,
        messageId,
        role,
        metadata,
        parts,
        createdAt: now,
      })
    }

    // Update chat timestamp to reflect recent activity
    await ctx.db.patch(chatId, {
      updatedAt: now,
    })
  },
})

/**
 * Clear all messages for a specific chat.
 * Validates chat ownership before deletion.
 */
const clearChatMessages = mutation({
  args: {
    chatId: v.id("chats"),
  },
  returns: v.null(),
  handler: async (ctx, { chatId }) => {
    const user = await throwIfNotAuthenticated(ctx)

    // Verify chat ownership
    const chat = await ctx.db.get(chatId)
    if (!chat) {
      throw new Error("Chat not found")
    }
    if (chat.userId !== user.id) {
      throw new Error("Unauthorized: You can only clear your own chats")
    }

    // Delete all messages for this chat
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_chat_id", (q) => q.eq("chatId", chatId))
      .collect()

    await Promise.all(messages.map((message) => ctx.db.delete(message._id)))
  },
})

/**
 * Store system prompt for debugging purposes.
 */
const createSystemPrompt = mutation({
  args: {
    content: v.string(),
  },
  returns: v.id("systemPrompts"),
  handler: async (ctx, { content }) => {
    await throwIfNotAuthenticated(ctx) // Ensure user is authenticated
    const now = new Date().toISOString()
    const promptId = await ctx.db.insert("systemPrompts", {
      content,
      createdAt: now,
    })
    return promptId
  },
})

export {
  getOrCreateProgramChat,
  getProgramChat,
  loadChatMessages,
  upsertMessage,
  clearChatMessages,
  createSystemPrompt,
}
