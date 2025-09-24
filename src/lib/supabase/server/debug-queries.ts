import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import type { MyUIMessage } from "@/lib/ai/ui-message-types"
import { createServerClient } from "../create-server-client"
import type { Database } from "../database.types"

type SystemPrompt = Database["public"]["Tables"]["system_prompts"]["Row"]
type Chat = Database["public"]["Tables"]["chats"]["Row"]
type ChatMessage = Database["public"]["Tables"]["chat_messages"]["Row"]

export interface ChatWithMetadata {
  id: string
  created_at: string
  updated_at: string
  user_id: string
  title: string | null
  message_count: number
  program_id: string | null
}

export interface ChatWithMessages {
  id: string
  created_at: string
  updated_at: string
  user_id: string
  title: string | null
  messages: MyUIMessage[]
}

/**
 * Get all chats with basic metadata for the debug interface
 */
export async function getAllChatsWithMetadata(): Promise<ChatWithMetadata[]> {
  const client = await createServerClient()

  // Get all chats with message count and program association
  const { data: chatsData, error } = await client
    .from("chats")
    .select(`
      id,
      created_at,
      updated_at,
      user_id,
      title,
      chat_messages(count),
      program_chats(program_id)
    `)
    .order("updated_at", { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch chats: ${error.message}`)
  }

  return (chatsData || []).map((chat: any) => ({
    id: chat.id,
    created_at: chat.created_at,
    updated_at: chat.updated_at,
    user_id: chat.user_id,
    title: chat.title,
    message_count: chat.chat_messages?.length || 0,
    program_id: chat.program_chats?.[0]?.program_id || null,
  }))
}

/**
 * Get a specific chat with all its messages
 */
export async function getChatWithMessages(
  chatId: string
): Promise<ChatWithMessages | null> {
  const client = await createServerClient()

  // Get chat metadata
  const { data: chat, error: chatError } = await client
    .from("chats")
    .select("*")
    .eq("id", chatId)
    .single()

  if (chatError || !chat) {
    return null
  }

  // Get messages for this chat
  const { data: messages, error: messagesError } = await client
    .from("chat_messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true })

  if (messagesError) {
    throw new Error(`Failed to fetch messages: ${messagesError.message}`)
  }

  // Transform messages to UIMessage format
  const uiMessages: MyUIMessage[] = (messages || []).map((dbMessage) => ({
    id: dbMessage.id,
    role: dbMessage.role as "user" | "assistant" | "system",
    metadata: dbMessage.metadata as MyUIMessage["metadata"],
    parts: dbMessage.parts as MyUIMessage["parts"],
  }))

  return {
    id: chat.id,
    created_at: chat.created_at,
    updated_at: chat.updated_at,
    user_id: chat.user_id,
    title: chat.title,
    messages: uiMessages,
  }
}

/**
 * Get all system prompts
 */
export async function getAllSystemPrompts(): Promise<SystemPrompt[]> {
  const client = await createServerClient()

  const { data: prompts, error } = await client
    .from("system_prompts")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch system prompts: ${error.message}`)
  }

  return prompts || []
}

/**
 * Get a specific system prompt by ID
 */
export async function getSystemPrompt(
  promptId: string
): Promise<SystemPrompt | null> {
  const client = await createServerClient()

  const { data: prompt, error } = await client
    .from("system_prompts")
    .select("*")
    .eq("id", promptId)
    .single()

  if (error) {
    return null
  }

  return prompt
}

/**
 * Store a new system prompt
 * Returns the ID of the created system prompt
 */
export async function createSystemPrompt(
  client: SupabaseClient,
  content: string
): Promise<string> {
  const { data: newPrompt, error } = await client
    .from("system_prompts")
    .insert({ content })
    .select("id")
    .single()

  if (error) {
    throw new Error(`Failed to store system prompt: ${error.message}`)
  }

  return newPrompt.id
}
