# Chat Persistence Design Document

## Overview

This document outlines the design for implementing chat persistence in the AI Fitness application, following the [AI SDK UI Chatbot Message Persistence](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence) guide. The goal is to create a persistent relationship between programs and their associated chat conversations, allowing users to continue their AI conversations when they revisit a program's studio page.

## Current State Analysis

### Existing Database Structure

- **`programs`** table: Contains program information with `id`, `user_id`, `name`, `type`, etc.
- **`workouts`** table: Related to programs via `program_id` foreign key
- **Chat API**: Located at `/api/chat/route.ts`, currently stateless with TODO comment for persistence

### Current Chat Flow

1. User visits `/home/studio/[programId]` page
2. `ProgramEditorSidebar` component initializes `useChat` hook
3. Chat messages are sent to `/api/chat` endpoint
4. AI responses are generated but not persisted
5. Chat history is lost on page refresh/navigation

## Proposed Solution

### 1. Database Schema Design

The design uses a simple approach where each program can have multiple chats, and we always load the latest chat for the program. This eliminates the complexity of managing "active" chat states.

**Performance Optimization**: Following the [AI SDK documentation](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence), we only send the last message to the server instead of the entire conversation history, significantly reducing payload size and improving performance.

**UIMessage Structure**: The schema is designed to store complete [UIMessage objects](https://ai-sdk.dev/docs/reference/ai-sdk-core/ui-message#uimessage) which include:

- `id`: Unique message identifier
- `role`: Message role (user, assistant, system)
- `metadata`: Custom metadata (JSONB for flexibility)
- `parts`: Array of message parts (text, tool calls, files, etc.) stored as JSONB

**JSONB Benefits**: Using JSONB for `metadata` and `parts` provides:

- **Flexibility**: Can store any UIMessage structure without schema changes
- **Performance**: JSONB is indexed and searchable in PostgreSQL
- **Type Safety**: Preserves the exact UIMessage structure from the frontend
- **Future-Proof**: Supports all UIMessage part types (text, tools, files, reasoning, etc.)

**Message Ordering**: We use `created_at` timestamps instead of `sequence_number` since:

- Messages are saved incrementally (only new messages added)
- No concurrent message creation within the same chat
- Simpler schema with natural chronological ordering
- `created_at` provides sufficient precision for message ordering

**Message ID Generation**: We use UUIDs for all message IDs to ensure uniqueness and consistency. UUIDs are generated on the client-side for user messages and server-side for AI responses, providing reliable message identification across sessions.

#### New Tables

##### `chats` Table

```sql
CREATE TABLE public.chats (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title text, -- Optional: AI-generated chat title for display
    -- Metadata for chat context
    metadata jsonb DEFAULT '{}'::jsonb
);
```

##### `chat_messages` Table

```sql
CREATE TABLE public.chat_messages (
    -- Use the UIMessage id as primary key for consistency
    id uuid NOT NULL PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    chat_id uuid NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    -- UIMessage.role: 'system' | 'user' | 'assistant'
    role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    -- UIMessage.metadata: custom metadata (JSONB for flexibility)
    metadata jsonb,
    -- UIMessage.parts: array of message parts (text, tool calls, files, etc.)
    parts jsonb NOT NULL
);
```

##### `program_chats` Table (Join Table)

```sql
CREATE TABLE public.program_chats (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
    chat_id uuid NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    UNIQUE(program_id, chat_id)
);
```

#### Indexes for Performance

```sql
-- Index for finding chats by user
CREATE INDEX idx_chats_user_id ON public.chats(user_id);

-- Index for finding messages by chat (ordered by creation time)
CREATE INDEX idx_chat_messages_chat_id_created ON public.chat_messages(chat_id, created_at);

-- Index for finding chats by program (ordered by creation date for latest chat)
CREATE INDEX idx_program_chats_program_id_created ON public.program_chats(program_id, created_at DESC);
```

#### Triggers

```sql
-- Auto-update updated_at on chats
CREATE TRIGGER update_chats_updated_at
    BEFORE UPDATE ON public.chats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2. Message Flow Optimization

Following the [AI SDK best practices](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence), our implementation optimizes the message flow by:

1. **Frontend**: Only sends the last user message to the server via `prepareSendMessagesRequest`
2. **Backend**: Upserts the user message immediately, then loads full conversation history
3. **Persistence**: Uses `upsertMessage` for both user messages and AI responses to handle duplicates gracefully

This approach reduces network payload while providing robust message persistence through PostgreSQL's upsert functionality.

### 3. API Layer Updates

#### Chat API Route Updates (`/api/chat/route.ts`)

```typescript
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
} from 'ai'
import { v4 as uuidv4 } from 'uuid'
import { buildSystemPrompt } from '@/lib/ai/prompts/prompts'
import { myProvider } from '@/lib/ai/providers'
import { type MyUIMessage, myTools } from '@/lib/ai/ui-message-types'

// Simplified request schema - only need the last message
const requestSchema = z.object({
  message: z.object({
    id: z.string(),
    role: z.enum(['user', 'assistant', 'system']),
    metadata: z.any().optional(),
    parts: z.array(z.any()), // UIMessage parts array
  }),
  contextItems: z.array(contextItemSchema).optional(),
  workouts: workoutsSchema,
  // New fields for persistence
  programId: z.string().uuid(),
  chatId: z.string().uuid().optional(), // Optional for new chats
})

// Updated POST handler
export async function POST(req: Request) {
  const { message, contextItems, workouts, programId, chatId } =
    requestSchema.parse(body)

  // Get or create chat for this program
  const resolvedChatId = chatId || (await getOrCreateProgramChat(programId))

  // Create or update last message in database
  await upsertMessage({ chatId: resolvedChatId, id: message.id, message })

  // Load previous messages from database
  const messages = await loadChatMessages(resolvedChatId)

  // Build system prompt
  const systemPrompt = buildSystemPrompt(contextItems, workouts)

  const stream = createUIMessageStream<MyUIMessage>({
    execute: ({ writer }) => {
      // If the last message is a user message, create our own start step
      if (message.role === 'user') {
        writer.write({
          type: 'start',
          messageId: uuidv4(),
        })
        writer.write({
          type: 'start-step',
        })
      }

      const result = streamText({
        model: myProvider.languageModel('chat-model'),
        system: systemPrompt,
        messages: convertToModelMessages(messages),
        tools: myTools({
          contextItems,
          existingWorkouts: workouts,
          writer,
        }),
        stopWhen: stepCountIs(4),
      })

      result.consumeStream()
      writer.merge(result.toUIMessageStream({ sendStart: false }))
    },
    onError: (error) => {
      return error instanceof Error ? error.message : String(error)
    },
    originalMessages: messages,
    onFinish: async ({ responseMessage }) => {
      try {
        await upsertMessage({
          id: responseMessage.id,
          chatId: resolvedChatId,
          message: responseMessage,
        })
      } catch (error) {
        console.error(error)
      }
    },
  })

  return createUIMessageStreamResponse({ stream })
}
```

#### New Database Operations

```typescript
// src/lib/supabase/server/chat-operations.ts

export async function getOrCreateProgramChat(
  programId: string
): Promise<string> {
  const client = await createServerClient()
  const userId = await getCurrentUserId()

  // Check for existing latest chat
  const { data: existingChat } = await client
    .from('program_chats')
    .select('chat_id')
    .eq('program_id', programId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (existingChat) {
    return existingChat.chat_id
  }

  // Create new chat
  const { data: newChat } = await client
    .from('chats')
    .insert({ user_id: userId })
    .select('id')
    .single()

  // Link to program
  await client.from('program_chats').insert({
    program_id: programId,
    chat_id: newChat.id,
  })

  return newChat.id
}

export async function loadProgramChat(
  programId: string
): Promise<{ chatId: string; messages: MyUIMessage[] } | null> {
  const client = await createServerClient()

  // Get the latest chat for this program
  const { data: programChat } = await client
    .from('program_chats')
    .select('chat_id')
    .eq('program_id', programId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!programChat) return null

  // Load messages for this chat
  const messages = await loadChatMessages(programChat.chat_id)

  return {
    chatId: programChat.chat_id,
    messages,
  }
}

export async function loadChatMessages(chatId: string): Promise<MyUIMessage[]> {
  const client = await createServerClient()

  const { data: messages } = await client
    .from('chat_messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true })

  if (!messages) return []

  // Transform database records back to UIMessage format
  return messages.map((dbMessage) => ({
    id: dbMessage.id,
    role: dbMessage.role as 'user' | 'assistant' | 'system',
    metadata: dbMessage.metadata || undefined,
    parts: dbMessage.parts, // Already in correct format from JSONB
  }))
}

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
  const { error } = await client.from('chat_messages').upsert({
    id: id,
    chat_id: chatId,
    role: message.role,
    metadata: message.metadata || null,
    parts: message.parts,
  })

  if (error) {
    throw new Error(`Failed to upsert message: ${error.message}`)
  }

  // Update chat timestamp
  await client
    .from('chats')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', chatId)
}
```

### 4. Frontend Updates

#### Program Studio Page (`/home/studio/[programId]/page.tsx`)

```typescript
export default async function Page({ params }: { params: Promise<{ programid: string }> }) {
  const programid = (await params).programid

  // ... existing data fetching ...

  // Load existing chat for this program
  const existingChat = await loadProgramChat(programid)

  return (
    <SidebarProvider>
      <EditorProgramProvider exercises={allExercises} initialProgram={program}>
        {/* ... existing JSX ... */}
        <ProgramEditorSidebar
          availableClients={clients}
          exercises={exercises.custom}
          trainerId={user.id}
          programId={programid}
          initialMessages={existingChat?.messages || []}
          chatId={existingChat?.chatId}
        />
        {/* ... */}
      </EditorProgramProvider>
    </SidebarProvider>
  )
}
```

#### ProgramEditorSidebar Component Updates

```typescript
interface ProgramEditorSidebarProps {
  trainerId: string
  exercises: Exercise[]
  availableClients: ClientWithTrainerNotes[]
  programId: string // New prop
  initialMessages?: MyUIMessage[] // New prop
  chatId?: string // New prop
}

export function ProgramEditorSidebar({
  exercises,
  availableClients,
  trainerId,
  programId, // New prop
  initialMessages = [], // New prop
  chatId, // New prop
}: ProgramEditorSidebarProps) {
  const { messages, sendMessage, status } = useChat<MyUIMessage>({
    id: chatId, // Use existing chat ID if available
    initialMessages, // Load existing messages
    transport: new DefaultChatTransport({
      api: '/api/chat',
      // Only send the last message to reduce payload size
      prepareSendMessagesRequest({ messages, id }) {
        return {
          body: {
            message: messages[messages.length - 1], // Only last message
            contextItems: contextItems.map((item) => ({
              type: item.type,
              data:
                item.type === 'client'
                  ? item.data
                  : {
                      exercises: item.data,
                      title: item.label,
                    },
            })),
            workouts,
            programId, // Include program ID
            chatId: id, // Use the chat ID from useChat
          },
        }
      },
    }),
    onData: ({ data, type }) => {
      // Handle existing onData logic for workout changes
      switch (type) {
        case 'data-diff': {
          const diffParsed = workoutChangeSchema.safeParse(data)
          if (diffParsed.success) {
            addProposedChanges([diffParsed.data])
          }
          break
        }
        case 'data-newWorkouts': {
          const workoutParsed = aiWorkoutSchema.safeParse(data)
          if (workoutParsed.success) {
            addWorkout({
              id: uuidv4(),
              program_id: programId,
              name: `Workout ${workouts.length + 1}`,
              program_order: workouts.length,
              blocks: workoutParsed.data.blocks.map(mapAIBlockToDomainBlock),
            })
          }
          break
        }
      }
    },
  })

  // ... rest of component
}
```

### 5. Migration Strategy

#### Phase 1: Database Setup

1. **Schema Changes**: Add the new chat tables to `supabase/migrations/20230727214151_db_schema_initial.sql`
   - Add `chats`, `chat_messages`, and `program_chats` tables
   - Add indexes and triggers for data consistency
2. **RLS Policies**: Add chat table policies to `supabase/migrations/20250903000050_rls.sql`
   - Add RLS policies for coach/client access patterns

3. **Manual Migration**: Run migrations manually (no `supabase db push` needed for this small project)

#### Phase 2: Backend Implementation

1. Create chat operations module
2. Update chat API route to support persistence
3. Add chat loading functionality to program queries
4. Update TypeScript types for new schema

#### Phase 3: Frontend Integration

1. Update ProgramEditorSidebar props and logic
2. Modify studio page to load existing chats
3. Update useChat configuration for persistence
4. Test end-to-end flow

#### Phase 4: Enhancements (Future)

1. Chat management UI (view/delete old chats)
2. Chat titles and summaries
3. Export chat functionality
4. Chat search and filtering

## Data Flow

### New Chat Creation

1. User visits `/home/studio/[programId]` for first time
2. Backend checks for existing latest chat for program
3. No chat found → creates new chat and links to program
4. Frontend initializes with empty chat

### Existing Chat Loading

1. User visits `/home/studio/[programId]` with existing chat
2. Backend finds latest chat and loads messages
3. Frontend initializes useChat with existing messages
4. User can continue conversation

### Message Persistence

1. User sends message → API receives with programId/chatId
2. AI processes and generates response
3. Both user message and AI response saved to database
4. Chat updated_at timestamp refreshed

## Security Considerations

**Simplified RLS Approach**: The chat tables use simplified RLS policies that grant full access to all authenticated users. This allows us to focus on application-level access controls rather than complex database-level restrictions.

```sql
-- ============================================================================
-- SIMPLIFIED RLS POLICIES FOR CHAT TABLES
-- ============================================================================

-- Enable RLS on chat tables
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_chats ENABLE ROW LEVEL SECURITY;

-- Simplified policies: All authenticated users have full access
CREATE POLICY "chats_authenticated_policy" ON public.chats
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "chat_messages_authenticated_policy" ON public.chat_messages
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "program_chats_authenticated_policy" ON public.program_chats
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
```

**Access Control Strategy**:
- **Database Level**: Simple authentication check only
- **Application Level**: Business logic handles coach/client access patterns
- **Benefits**: Reduced complexity, easier debugging, faster development iteration
- **Security**: Authentication required, authorization handled in application code

## Testing Strategy

1. **Unit Tests**: Test chat operations functions
2. **Integration Tests**: Test full chat persistence flow
3. **E2E Tests**: Test user journey from program visit to chat persistence
4. **Performance Tests**: Test query performance with large chat histories

## Rollback Plan

If issues arise:

1. Disable chat persistence feature flag
2. Revert to stateless chat behavior
3. Keep database tables for future retry
4. Monitor for any data consistency issues

## Future Enhancements

1. **Chat Branching**: Allow multiple chat threads per program
2. **Chat Templates**: Pre-configured chat starters for different program types
3. **Chat Analytics**: Track usage patterns and popular queries
4. **Export/Import**: Allow users to backup/restore chat history
5. **Chat Sharing**: Share interesting chat conversations with other trainers
