"use client"

import { useChat } from "@ai-sdk/react"
import { Dumbbell, Plus, UserIcon, X } from "lucide-react"
import {
  type ChangeEvent,
  type ComponentProps,
  type FormEvent,
  useState,
} from "react"
import { Markdown } from "@/components/markdown"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useZProgramWorkouts } from "@/hooks/zustand/program-editor-state"
import type { ClientHomePage } from "@/lib/domain/clients"
import type { Exercise } from "@/lib/domain/workouts"
import { cn } from "@/lib/utils"
import {
  AIConversation,
  AIConversationContent,
  AIConversationScrollButton,
} from "./ai/AIConversation"
import {
  AIInput,
  AIInputButton,
  AIInputSubmit,
  AIInputTextarea,
  AIInputToolbar,
  AIInputTools,
} from "./ai/AIInput"
import { DataStreamHandler } from "./DataStreamHandler"
import { ExerciseSelectionDialog } from "./forms/ExerciseSelectionDialog"
import { Icons } from "./icons"
import { Avatar, AvatarFallback } from "./ui/avatar"
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
  client?: ClientHomePage // Make client optional
  availableClients?: ClientHomePage[] // List of available clients to choose from
}

type ClientContextItem = {
  type: "client"
  label: string
  data: ClientHomePage
}

type ExercisesContextItem = {
  type: "exercises"
  label: string
  data: Exercise[]
}

type ContextItem = ClientContextItem | ExercisesContextItem

export function ProgramEditorSidebar({
  exercises: initialExercises,
  trainerId,
  availableClients = [],
}: ProgramEditorSidebarProps) {
  const workouts = useZProgramWorkouts()
  const [exercises, setExercises] = useState<Exercise[]>(initialExercises)
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

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    data: dataStream,
  } = useChat({
    api: "/api/chat",
    body: {
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
    },
    initialMessages: [],
  })

  const onAddContext = (payload: ContextAddPayload) => {
    if (payload.type === "client") {
      addClientContext(payload.data)
    } else if (payload.type === "exercises") {
      addExercisesContext(payload.data)
    }
  }
  const addClientContext = (selectedClient: ClientHomePage) => {
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
    setExercises(allExercisesSelected)

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

  const handleExercisesChange = (newExercises: Exercise[]) => {
    setExercises(newExercises)
    // Update context item if it exists
    setContextItems((prev) => {
      return prev.map((item) => {
        if (item.type === "exercises") {
          return {
            ...item,
            label: `${newExercises.length} Preferred Exercises`,
            data: newExercises,
          }
        }
        return item
      })
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
        <ExerciseSelectionDialog
          allExercises={initialExercises}
          exercises={exercises}
          key={item.label}
          selectedExercises={exercises}
          setExercises={handleExercisesChange}
        >
          <Badge className="flex cursor-pointer items-center gap-1 border-input bg-background text-foreground text-xs">
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
        </ExerciseSelectionDialog>
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
      <SidebarHeader />
      <SidebarContent className="flex flex-col">
        <DataStreamHandler dataStream={dataStream} />
        <AIConversation className="size-full">
          <AIConversationContent className="space-y-4">
            {messages.map((message) => (
              <div
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
                key={message.id}
              >
                {message.role === "assistant" && (
                  <Avatar className="size-8 shrink-0">
                    <AvatarFallback className="border border-input bg-primary-foreground text-primary">
                      <Icons.sparkles className="size-4" />
                    </AvatarFallback>
                  </Avatar>
                )}

                {message.role === "assistant" && (
                  <div className="flex flex-col gap-2 text-primary text-sm leading-relaxed">
                    {/* {status === "streaming" && (
                      <div className="flex animate-pulse items-center gap-2 text-muted-foreground">
                        <Icons.sparkles className="size-3" />
                        <span>Thinking...</span>
                      </div>
                    )} */}
                    {status === "streaming" && message.parts ? (
                      // Handle streaming parts
                      message.parts.map((part, index) => {
                        if (part.type === "tool-invocation") {
                          const toolInvocation = part.toolInvocation
                          return (
                            <div
                              className="flex animate-pulse items-center gap-2 text-muted-foreground"
                              key={`tool-${index}`}
                            >
                              <Icons.wrench className="size-3" />
                              <span>Running {toolInvocation.toolName}...</span>
                            </div>
                          )
                        }
                        if (part.type === "text") {
                          return (
                            <Markdown key={`text-${index}`}>
                              {part.text}
                            </Markdown>
                          )
                        }
                        return null
                      })
                    ) : (
                      <Markdown>{message.content}</Markdown>
                    )}
                  </div>
                )}

                {message.role === "user" && (
                  <div className="ml-auto max-w-[80%] rounded-lg bg-primary px-3 py-2 text-primary-foreground text-sm leading-relaxed">
                    {message.content}
                  </div>
                )}
              </div>
            ))}
            {status === "submitted" && (
              <div className="rounded-lg px-3 py-2 text-sm">
                <div className="flex animate-pulse items-center gap-2">
                  <span className="text-muted-foreground">Thinking...</span>
                </div>
              </div>
            )}
          </AIConversationContent>
          <AIConversationScrollButton />
        </AIConversation>
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
            onChange={handleInputChange}
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
    clients: ClientHomePage[]
    exercises: Exercise[]
    contextItems: ContextItem[]
  }
  onAddContext: (payload: ContextAddPayload) => void
}

type ClientContextAddPayload = {
  type: "client"
  data: ClientHomePage
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
    <AIInput onSubmit={onSubmit}>
      <AIInputTextarea onChange={onChange} value={value} />
      <AIInputToolbar>
        <AIInputTools>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <AIInputButton>
                <Plus className="size-4" />
              </AIInputButton>
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
        </AIInputTools>
        <AIInputSubmit disabled={!value} status="ready" />
      </AIInputToolbar>
    </AIInput>
  )
}
