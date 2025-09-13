import "server-only"

import type { MyUIMessage } from "@/lib/ai/ui-message-types"
import { createServerClient } from "../create-server-client"
import type { Json } from "../database.types"
import { authUserRequest } from "./auth-utils"

/**
 * Get or create the latest chat for a program.
 * If no chat exists, creates a new one and links it to the program.
 *
 * @param programId - The UUID of the program
 * @returns The chat ID (UUID)
 */
export async function getOrCreateProgramChat(
  programId: string
): Promise<string> {
  const client = await createServerClient()
  const user = await authUserRequest()

  // Check for existing latest chat for this program
  const { data: existingChat } = await client
    .from("program_chats")
    .select("chat_id")
    .eq("program_id", programId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingChat) {
    return existingChat.chat_id
  }

  // Create new chat
  const { data: newChat, error: chatError } = await client
    .from("chats")
    .insert({ user_id: user.userId })
    .select("id")
    .single()

  if (chatError) {
    throw new Error(`Failed to create chat: ${chatError.message}`)
  }

  // Link chat to program
  const { error: linkError } = await client.from("program_chats").insert({
    program_id: programId,
    chat_id: newChat.id,
  })

  if (linkError) {
    throw new Error(`Failed to link chat to program: ${linkError.message}`)
  }

  return newChat.id
}

/**
 * Load existing chat data for a program, including all messages.
 * Used when loading the program studio page.
 *
 * @param programId - The UUID of the program
 * @returns Chat data with messages, or null if no chat exists
 */
export async function loadProgramChat(
  programId: string
): Promise<{ chatId: string; messages: MyUIMessage[] } | null> {
  const client = await createServerClient()

  // Get the latest chat for this program
  const { data: programChat } = await client
    .from("program_chats")
    .select("chat_id")
    .eq("program_id", programId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!programChat) return null

  // Load messages for this chat
  const messages = await loadChatMessages(programChat.chat_id)

  return {
    chatId: programChat.chat_id,
    messages,
  }
}

/**
 * Load all messages for a specific chat, ordered chronologically.
 * Transforms database records back to UIMessage format.
 *
 * @param chatId - The UUID of the chat
 * @returns Array of UIMessage objects
 */
export async function loadChatMessages(chatId: string): Promise<MyUIMessage[]> {
  const client = await createServerClient()

  const { data: messages, error } = await client
    .from("chat_messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true })

  if (error) {
    throw new Error(`Failed to load chat messages: ${error.message}`)
  }

  if (!messages) return []

  // Transform database records back to UIMessage format
  return messages.map((dbMessage) => ({
    id: dbMessage.id,
    role: dbMessage.role as "user" | "assistant" | "system",
    metadata: dbMessage.metadata as MyUIMessage["metadata"],
    parts: dbMessage.parts as MyUIMessage["parts"],
  }))
}

/**
 * Insert or update a message in the database.
 * Uses PostgreSQL upsert to handle duplicates gracefully.
 * Also updates the chat's updated_at timestamp.
 *
 * @param params - Message data and chat context
 */
export async function upsertMessage({
  chatId,
  id,
  message,
}: {
  chatId: string
  id: string
  message: MyUIMessage
}): Promise<void> {
  const client = await createServerClient()

  // Use upsert to insert or update the message
  // Note: We serialize the complex UIMessage parts to JSON for database storage
  const { error: messageError } = await client.from("chat_messages").upsert({
    id,
    chat_id: chatId,
    role: message.role,
    metadata: message.metadata as Json,
    parts: message.parts as Json,
  })

  if (messageError) {
    throw new Error(`Failed to upsert message: ${messageError.message}`)
  }

  // Update chat timestamp to reflect recent activity
  const { error: chatError } = await client
    .from("chats")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", chatId)

  if (chatError) {
    throw new Error(`Failed to update chat timestamp: ${chatError.message}`)
  }
}
