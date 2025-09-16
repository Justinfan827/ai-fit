"use client"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Dumbbell, Plus, UserIcon, X } from "lucide-react"
import { type ChangeEvent, type FormEvent, useState } from "react"
import { v4 as uuidv4 } from "uuid"
import {
  PromptInput,
  PromptInputButton,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input"
import { Sidebar, SidebarContent, SidebarFooter } from "@/components/ui/sidebar"
import {
  useZEditorActions,
  useZProgramId,
  useZProgramWorkouts,
} from "@/hooks/zustand/program-editor-state"
import { type AIBlock, aiWorkoutSchema } from "@/lib/ai/tools/ai-only-schema"
import { editWorkoutPlanActionsSchema } from "@/lib/ai/tools/editWorkoutPlan/schemas"
import { workoutChangeSchema } from "@/lib/ai/tools/generateProgramDiffs/diff-schema"
import type { MyUIMessage } from "@/lib/ai/ui-message-types"
import type { ClientWithTrainerNotes } from "@/lib/domain/clients"
import type { Block, Exercise } from "@/lib/domain/workouts"
import log from "@/lib/logger/logger"
import { isLive } from "@/lib/utils"
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "./ai-elements/conversation"
import { ChatMessages } from "./chat-messages"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { Separator } from "./ui/separator"

interface ProgramEditorSidebarProps {
  trainerId: string
  exercises: Exercise[]
  client?: ClientWithTrainerNotes // Make client optional
  availableClients?: ClientWithTrainerNotes[] // List of available clients to choose from
  programId: string // Required for chat persistence
  initialMessages?: MyUIMessage[] // Existing chat history
  chatId?: string // Existing chat ID
}

type ClientContextItem = {
  type: "client"
  label: string
  data: ClientWithTrainerNotes
}

type ExercisesContextItem = {
  type: "exercises"
  label: string
  data: Exercise[]
}

type ContextItem = ClientContextItem | ExercisesContextItem

// Map AI-generated blocks to domain blocks
const mapAIBlockToDomainBlock = (aiBlock: AIBlock): Block => {
  if (aiBlock.type === "exercise") {
    return aiBlock // Exercise blocks match exactly
  }
  if (aiBlock.type === "circuit") {
    return {
      ...aiBlock,
      circuit: {
        ...aiBlock.circuit,
        isDefault: false, // Default to false for AI-generated circuits
      },
    }
  }
  throw new Error(`Unknown block type: ${aiBlock}`)
}

const Thinking = () => {
  return (
    <div className="rounded-lg px-3 py-2 text-sm">
      <div className="flex animate-pulse items-center gap-2">
        <span className="text-muted-foreground">Thinking...</span>
      </div>
    </div>
  )
}

export function ProgramEditorSidebar({
  exercises: initialExercises,
  availableClients = [],
  programId,
  initialMessages = [],
  chatId,
}: ProgramEditorSidebarProps) {
  const workouts = useZProgramWorkouts()
  const zustandProgramId = useZProgramId()
  const [contextItems, setContextItems] = useState<ContextItem[]>(() => {
    return [
      {
        id: "exercises-preferred",
        type: "exercises",
        label: `Exercises (${initialExercises.length})`,
        data: initialExercises,
      },
    ]
  })

  const [input, setInput] = useState("")
  const [showDebugMessagesLocal, setShowDebugMessages] = useState(false)
  const showDebugMessages = showDebugMessagesLocal && !isLive()
  const handleToggleDebugMessages = () => {
    setShowDebugMessages((prev) => !prev)
  }

  const { addProposedChanges, addWorkout, applyEditWorkoutPlanActions } =
    useZEditorActions()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      const body = {
        contextItems: contextItems.map((item) => ({
          type: item.type,
          data:
            item.type === "client"
              ? item.data
              : {
                  exercises: item.data,
                  title: item.label,
                },
        })),
        workouts,
        programId,
      }
      sendMessage({ text: input.trim() }, { body })
      setInput("")
    }
  }

  const {
    messages: uiMessages,
    status,
    sendMessage,
    error,
  } = useChat<MyUIMessage>({
    id: chatId,
    generateId: () => uuidv4(),
    messages: initialMessages, // Load existing messages using correct property name
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest: ({ body, messages }) => {
        return {
          body: {
            message: messages.at(-1),
            ...body,
          },
        }
      },
    }),
    onData: ({ data, type }) => {
      switch (type) {
        case "data-diff": {
          log.info("workout-diff", data)
          const diffParsed = workoutChangeSchema.safeParse(data)
          if (!diffParsed.success) {
            log.error("Diff generation caught error:", diffParsed.error)
            return
          }
          addProposedChanges([diffParsed.data])
          break
        }
        case "data-editWorkoutPlanActions": {
          log.info("edit-workout-plan-actions", data)
          const editWorkoutPlanActionsParsed =
            editWorkoutPlanActionsSchema.safeParse(data)
          if (!editWorkoutPlanActionsParsed.success) {
            log.error(
              "Edit workout plan actions generation caught error:",
              editWorkoutPlanActionsParsed.error
            )
            return
          }
          applyEditWorkoutPlanActions(editWorkoutPlanActionsParsed.data)
          break
        }
        case "data-newWorkouts": {
          const workoutParsed = aiWorkoutSchema.safeParse(data)
          if (!workoutParsed.success) {
            log.error("Workout generation caught error:", workoutParsed.error)
            return
          }
          addWorkout({
            id: uuidv4(),
            program_id: zustandProgramId,
            name: `Workout ${workouts.length + 1}`,
            program_order: workouts.length,
            blocks: workoutParsed.data.blocks.map(mapAIBlockToDomainBlock),
          })
          break
        }

        default:
          break
      }
    },
  })

  const onAddContext = (payload: ContextAddPayload) => {
    if (payload.type === "client") {
      addClientContext(payload.data)
    } else if (payload.type === "exercises") {
      addExercisesContext(payload.data)
    }
  }
  const addClientContext = (selectedClient: ClientWithTrainerNotes) => {
    const clientItem: ContextItem = {
      type: "client",
      label: `${selectedClient.firstName} ${selectedClient.lastName}`,
      data: selectedClient,
    }
    setContextItems((prev) => {
      // Remove any existing client context first
      const filtered = prev.filter((item) => item.type !== "client")
      return [...filtered, clientItem]
    })
  }

  // TODO: figure out how to handle subset of selected exercises
  const addExercisesContext = (_selectedExercises: Exercise[]) => {
    // When adding the exercise context we want ALL library exercises selected by default
    const allExercisesSelected = initialExercises

    // Update local state so the dialog opens with everything pre-selected

    const exerciseItem: ContextItem = {
      type: "exercises",
      label: `Exercises (${allExercisesSelected.length})`,
      data: allExercisesSelected,
    }

    setContextItems((prev) => {
      // Remove any existing exercise context first
      const filtered = prev.filter((item) => item.type !== "exercises")
      return [...filtered, exerciseItem]
    })
  }

  const removeContextItem = (label: string) => {
    setContextItems((prev) => prev.filter((item) => item.label !== label))
  }

  const getContextIcon = (type: string) => {
    switch (type) {
      case "client":
        return <UserIcon className="size-3" />
      case "exercises":
        return <Dumbbell className="size-3" />
      default:
        return null
    }
  }

  const renderContextBadge = (item: ContextItem) => {
    if (item.type === "exercises") {
      return (
        <Badge
          className="flex cursor-pointer items-center gap-1 border-input bg-background text-foreground text-xs"
          key={item.label}
        >
          {getContextIcon(item.type)}
          <span>{item.label}</span>
          <Button
            className="hover:bg-transparent"
            onClick={(e) => {
              e.stopPropagation()
              removeContextItem(item.label)
            }}
            size="noSize"
            variant="ghost"
          >
            <X className="size-3" />
          </Button>
        </Badge>
      )
    }

    return (
      <Badge
        className="flex cursor-pointer items-center gap-1 border-input bg-background text-foreground text-xs"
        key={item.label}
      >
        {getContextIcon(item.type)}
        <span>{item.label}</span>
        <Button
          className="hover:bg-transparent"
          onClick={() => removeContextItem(item.label)}
          size="noSize"
          variant="ghost"
        >
          <X className="size-3" />
        </Button>
      </Badge>
    )
  }

  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      collapsible="offcanvas"
      side="right"
      variant="inset"
    >
      <SidebarContent className="flex flex-col ">
        <div className="border-b px-4 py-2">
          <div className="flex items-center justify-between">
            <Button
              aria-pressed={showDebugMessages}
              className="h-7 px-2 text-xs"
              onClick={handleToggleDebugMessages}
              size="sm"
              type="button"
              variant={showDebugMessages ? "default" : "outline"}
            >
              {showDebugMessages ? "Hide" : "Show Messages"}
            </Button>
          </div>
          {!isLive() && (
            <div>
              <p>chat status: {status}</p>
              <p>messages: {uiMessages.length}</p>
              <p>error: {error ? error.message : "No error"}</p>
            </div>
          )}
          {showDebugMessages && (
            <div className="mt-2 overflow-auto rounded-md bg-muted p-2">
              <pre className="whitespace-pre-wrap break-words text-[11px] leading-relaxed">
                {JSON.stringify(uiMessages, null, 2)}
              </pre>
            </div>
          )}
        </div>
        <Conversation>
          <ConversationContent className="scrollbar scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
            <ChatMessages messages={uiMessages} />
            {status === "submitted" && <Thinking />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </SidebarContent>
      <SidebarFooter>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {/* Context Items */}
            {contextItems.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {contextItems.map((item) => renderContextBadge(item))}
              </div>
            )}
          </div>
          <SidebarInput
            onAddContext={onAddContext}
            onChange={(e) => setInput(e.target.value)}
            onSubmit={handleSubmit}
            state={{
              clients: availableClients,
              exercises: initialExercises,
              contextItems,
            }}
            value={input}
          />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

interface SidebarInputProps {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void
  value: string
  state: {
    clients: ClientWithTrainerNotes[]
    exercises: Exercise[]
    contextItems: ContextItem[]
  }
  onAddContext: (payload: ContextAddPayload) => void
}

type ClientContextAddPayload = {
  type: "client"
  data: ClientWithTrainerNotes
}

type ExercisesContextAddPayload = {
  type: "exercises"
  data: Exercise[]
}

type ContextAddPayload = ClientContextAddPayload | ExercisesContextAddPayload

function SidebarInput({
  onChange,
  onSubmit,
  state,
  onAddContext,
  value,
}: SidebarInputProps) {
  return (
    <PromptInput onSubmit={onSubmit}>
      <PromptInputTextarea onChange={onChange} value={value} />
      <PromptInputToolbar>
        <PromptInputTools>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <PromptInputButton>
                <Plus className="size-4" />
              </PromptInputButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {state.clients.length > 0 && (
                <>
                  <div className="px-2 py-1.5 font-medium text-muted-foreground text-xs">
                    Clients
                  </div>
                  {state.clients.map((availableClient) => (
                    <DropdownMenuItem
                      disabled={state.contextItems.some(
                        (item) =>
                          item.type === "client" &&
                          item.data.id === availableClient.id
                      )}
                      key={availableClient.id}
                      onClick={() =>
                        onAddContext({
                          type: "client",
                          data: availableClient,
                        })
                      }
                    >
                      <UserIcon className="mr-2 size-4" />
                      {availableClient.firstName}
                    </DropdownMenuItem>
                  ))}
                  <Separator className="my-1" />
                </>
              )}
              <div className="px-2 py-1.5 font-medium text-muted-foreground text-xs">
                Exercise Library
              </div>
              <DropdownMenuItem
                disabled={state.contextItems.some(
                  (item) => item.type === "exercises"
                )}
                onClick={() =>
                  onAddContext({
                    type: "exercises",
                    data: state.exercises,
                  })
                }
              >
                <Dumbbell className="mr-2 size-4" />
                Exercises ({state.exercises.length})
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </PromptInputTools>
        <PromptInputSubmit disabled={!value} status="ready" />
      </PromptInputToolbar>
    </PromptInput>
  )
}
