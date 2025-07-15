"use client"

import { useChat } from "@ai-sdk/react"
import { Dumbbell, Plus, UserIcon, X } from "lucide-react"
import * as React from "react"
import { Markdown } from "@/components/markdown"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  useZProgramWorkouts,
  useZProposedChanges,
} from "@/hooks/zustand/program-editor"
import type { ClientHomePage } from "@/lib/domain/clients"
import type { Exercise } from "@/lib/domain/workouts"
import { cn } from "@/lib/utils"
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
import { ScrollArea } from "./ui/scroll-area"
import { Separator } from "./ui/separator"
import { Textarea } from "./ui/textarea"

interface ProgramEditorSidebarProps
  extends React.ComponentProps<typeof Sidebar> {
  trainerId: string
  exercises: Exercise[]
  client?: ClientHomePage // Make client optional
  availableClients?: ClientHomePage[] // List of available clients to choose from
}

interface ContextItem {
  id: string
  type: "client" | "exercises"
  label: string
  data: any
}

export function ProgramEditorSidebar({
  exercises: initialExercises,
  trainerId,
  availableClients = [],
  ...props
}: ProgramEditorSidebarProps) {
  const workouts = useZProgramWorkouts()
  const proposedChanges = useZProposedChanges()
  console.log(workouts)
  console.log(proposedChanges)
  const [exercises, setExercises] = React.useState<Exercise[]>(initialExercises)
  const [contextItems, setContextItems] = React.useState<ContextItem[]>(() => {
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

  const scrollAreaRef = React.useRef<HTMLDivElement>(null)
  const bottomRef = React.useRef<HTMLDivElement>(null)

  // Utility function to scroll to bottom
  const scrollToBottom = React.useCallback(() => {
    if (bottomRef.current) {
      // Ensure we wait until next paint so DOM is up to date
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: "auto" })
      })
    }
  }, [])

  // Auto-scroll to bottom when new messages arrive or when typing
  React.useEffect(() => {
    scrollToBottom()
  }, [messages, status, scrollToBottom])

  const addClientContext = (selectedClient: ClientHomePage) => {
    const clientItem: ContextItem = {
      id: `client-${selectedClient.id}`,
      type: "client",
      label: selectedClient.firstName,
      data: selectedClient,
    }
    setContextItems((prev) => {
      // Remove any existing client context first
      const filtered = prev.filter((item) => item.type !== "client")
      return [...filtered, clientItem]
    })
  }

  const addExercisesContext = () => {
    // When adding the exercise context we want ALL library exercises selected by default
    const allExercisesSelected = initialExercises

    // Update local state so the dialog opens with everything pre-selected
    setExercises(allExercisesSelected)

    const exerciseItem: ContextItem = {
      id: "exercises-preferred",
      type: "exercises",
      label: `${allExercisesSelected.length} Preferred Exercises`,
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

  const removeContextItem = (id: string) => {
    setContextItems((prev) => prev.filter((item) => item.id !== id))
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
          key={item.id}
          selectedExercises={exercises}
          setExercises={handleExercisesChange}
        >
          <Badge
            className="flex cursor-pointer items-center gap-1 text-xs"
            variant="secondary"
          >
            {getContextIcon(item.type)}
            <span>{item.label}</span>
            <Button
              className="hover:bg-transparent"
              onClick={(e) => {
                e.stopPropagation()
                removeContextItem(item.id)
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
        className="flex items-center gap-1 text-xs"
        key={item.id}
        variant="secondary"
      >
        {getContextIcon(item.type)}
        <span>{item.label}</span>
        <Button
          className="hover:bg-transparent"
          onClick={() => removeContextItem(item.id)}
          size="noSize"
          variant="ghost"
        >
          <X className="size-3" />
        </Button>
      </Badge>
    )
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="px-4">
          <h3 className="font-normal text-lg text-muted-foreground uppercase tracking-wide">
            Chat
          </h3>
        </div>
      </SidebarHeader>
      <SidebarContent className="flex flex-col">
        {/* Chat Messages Area */}
        <DataStreamHandler dataStream={dataStream} />
        <div className="flex min-h-0 flex-1 flex-col">
          <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
            <div className="space-y-4 py-4">
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
                      {status === "streaming" && (
                        <div className="flex animate-pulse items-center gap-2 text-muted-foreground">
                          <Icons.sparkles className="size-3" />
                          <span>Thinking...</span>
                        </div>
                      )}
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
                                <span>
                                  Running {toolInvocation.toolName}...
                                </span>
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

              {/* bottom sentinel to keep viewport anchored */}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>
        </div>
      </SidebarContent>

      <SidebarFooter>
        <div className="space-y-3 px-4 pb-2">
          <form className="relative flex gap-2" onSubmit={handleSubmit}>
            <div className="absolute top-3 left-3">
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      className="text-muted-foreground"
                      size="xs"
                      variant="outline"
                    >
                      <Plus className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    {availableClients.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 font-medium text-muted-foreground text-xs">
                          Clients
                        </div>
                        {availableClients.map((availableClient) => (
                          <DropdownMenuItem
                            disabled={contextItems.some(
                              (item) =>
                                item.type === "client" &&
                                item.data.id === availableClient.id
                            )}
                            key={availableClient.id}
                            onClick={() => addClientContext(availableClient)}
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
                      disabled={contextItems.some(
                        (item) => item.type === "exercises"
                      )}
                      onClick={addExercisesContext}
                    >
                      <Dumbbell className="mr-2 size-4" />
                      Exercises ({exercises.length})
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="space-y-2">
                  {contextItems.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {contextItems.map((item) => renderContextBadge(item))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <Textarea
              className="min-h-[80px] resize-none pt-12 pb-14 text-sm"
              disabled={status === "streaming"}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
              placeholder="Ask me to build your program..."
              value={input}
            />
            <div className="absolute right-3 bottom-3">
              <Button
                className="shrink-0 rounded-full p-1.5"
                disabled={status === "streaming" || !input.trim()}
                size="noSize"
                type="submit"
              >
                <Icons.send className="size-4" />
              </Button>
            </div>
          </form>
          <p className="text-center text-muted-foreground text-xs">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
