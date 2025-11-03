<!-- 7c450c95-876c-499d-a2fc-d974b63d12d7 452dfcde-bf98-4c35-aef5-f3b92a98bd38 -->
# Migrate Chat Database to Convex

## Changes Overview

Create Convex schemas and functions to replace Supabase for chat persistence, then update the Next.js API route to call Convex functions.

## Implementation Steps

### 1. Add Chat Schemas to Convex

**File:** `convex/schema.ts`

Add four new tables to match the Supabase structure:

- `chats` table:
- `userId: v.id("users")` - owner of the chat
- `title: v.optional(v.string())` - AI-generated chat title
- `metadata: v.any()` - flexible metadata (JSONB equivalent)
- `createdAt: v.string()` - ISO8601 timestamp
- `updatedAt: v.string()` - ISO8601 timestamp
- Index: `by_user_id` on `userId`

- `chatMessages` table:
- `chatId: v.id("chats")` - reference to parent chat
- `role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system"))` - message role
- `metadata: v.any()` - UIMessage metadata
- `parts: v.any()` - UIMessage parts (text, tool calls, etc.)
- `createdAt: v.string()` - ISO8601 timestamp
- Index: `by_chat_id` on `chatId`
- Index: `by_chat_id_and_created_at` on `["chatId", "createdAt"]`

- `programChats` table (junction table):
- `programId: v.id("programs")` - reference to program
- `chatId: v.id("chats")` - reference to chat
- `createdAt: v.string()` - ISO8601 timestamp
- Index: `by_program_id` on `programId`
- Index: `by_program_id_and_created_at` on `["programId", "createdAt"]`
- Index: `by_chat_id` on `chatId`

- `systemPrompts` table (for debugging):
- `content: v.string()` - the full system prompt text
- `createdAt: v.string()` - ISO8601 timestamp

### 2. Create Convex Chat Functions

**File:** `convex/chats.ts` (new file)

Implement mutations and queries to replace Supabase operations:

**Mutations:**

- `getOrCreateProgramChat`: Get existing chat for program or create new one
- Args: `{ programId: v.id("programs") }`
- Returns: `v.id("chats")`
- Logic:

1. Get authenticated user
2. Query `programChats` by `programId` (descending order)
3. If found, return `chatId`
4. If not found: create chat, create program-chat link, return `chatId`

- `upsertMessage`: Insert or update a message
- Args: `{ chatId: v.id("chats"), messageId: v.string(), role, metadata, parts }`
- Returns: `v.null()`
- Logic:

1. Check if message exists by querying with custom ID field
2. Insert or patch the message
3. Update chat's `updatedAt` timestamp

- `clearChatMessages`: Clear all messages for a chat (for debugging)
- Args: `{ chatId: v.id("chats") }`
- Returns: `v.null()`
- Logic:

1. Verify user owns the chat
2. Delete all messages for that chat

- `createSystemPrompt`: Store system prompt for debugging
- Args: `{ content: v.string() }`
- Returns: `v.id("systemPrompts")`

**Queries:**

- `loadChatMessages`: Load all messages for a chat
- Args: `{ chatId: v.id("chats") }`
- Returns: Array of message objects with `id`, `role`, `metadata`, `parts`
- Logic: Query messages by `chatId`, order by `createdAt` ascending

- `getProgramChat`: Get chat info for a program (for sidebar loading)
- Args: `{ programId: v.id("programs") }`
- Returns: `{ chatId, messages }` or `null`

### 3. Update API Route to Use Convex

**File:** `src/app/api/chat/route.ts`

Uncomment and update the implementation to use Convex:

- Import Convex client setup (fetchMutation, fetchQuery from `convex/server`)
- Replace `getOrCreateProgramChat` with Convex mutation call
- Replace `upsertMessage` with Convex mutation call
- Replace `loadChatMessages` with Convex query call
- Replace `createSystemPrompt` with Convex mutation call
- Keep the auth wrapper and streaming logic
- Use Convex IDs instead of UUIDs

**Key Changes:**

- Import: `import { fetchMutation, fetchQuery } from "convex/server"`
- Import: `import { api } from "@/convex/_generated/api"`
- Convert `programId` string to `Id<"programs">`
- Call Convex functions instead of Supabase functions
- Handle Convex ID types properly

### 4. Handle Message IDs

Since messages use custom UUIDs from the AI SDK:

- Store the AI SDK message UUID in a `messageId` field (as a string)
- Add index on `messageId` for efficient lookups during upserts
- Use `messageId` (not Convex `_id`) when referencing messages
- Query messages by `messageId` to check if they exist before upserting
- Don't return the Convex `_id` - only use the custom `messageId` field

### 5. Update Types

**File:** `src/lib/ai/ui-message-types.ts` or similar

- Ensure `MyUIMessage` type matches what Convex will return
- May need to adjust ID fields to work with both UUID strings and Convex IDs

### To-dos

- [ ] Add chats, chatMessages, programChats, and systemPrompts tables to convex/schema.ts with appropriate indexes
- [ ] Create convex/chats.ts with mutations and queries for chat operations (getOrCreateProgramChat, upsertMessage, loadChatMessages, etc.)
- [ ] Update /api/chat/route.ts to call Convex functions instead of Supabase, handle Convex ID types
- [ ] Test the full chat flow: creating chat, sending messages, loading messages, persistence