'use client'

import { useChat } from '@ai-sdk/react'
import { Dumbbell, Plus, UserIcon, X } from 'lucide-react'
import * as React from 'react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { ClientHomePage } from '@/lib/domain/clients'
import { Exercise } from '@/lib/domain/workouts'
import { cn } from '@/lib/utils'
import { ExerciseSelectionDialog } from './forms/ExerciseSelectionDialog'
import { Icons } from './icons'
import { Avatar, AvatarFallback } from './ui/avatar'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { ScrollArea } from './ui/scroll-area'
import { Separator } from './ui/separator'
import { Textarea } from './ui/textarea'

interface ProgramEditorSidebarProps
  extends React.ComponentProps<typeof Sidebar> {
  trainerId: string
  exercises: Exercise[]
  client?: ClientHomePage // Make client optional
  availableClients?: ClientHomePage[] // List of available clients to choose from
}

interface ContextItem {
  id: string
  type: 'client' | 'exercises'
  label: string
  data: any
}

export function ProgramEditorSidebar({
  exercises: initialExercises,
  trainerId,
  availableClients = [],
  ...props
}: ProgramEditorSidebarProps) {
  const [exercises, setExercises] = React.useState<Exercise[]>(initialExercises)
  const [contextItems, setContextItems] = React.useState<ContextItem[]>(() => {
    return [
      {
        id: 'exercises-preferred',
        type: 'exercises',
        label: `Exercises (${initialExercises.length})`,
        data: initialExercises,
      },
    ]
  })

  const { messages, input, handleInputChange, handleSubmit, status } = useChat({
    api: '/api/chat',
    body: {
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
    },
    initialMessages: [],
  })

  const scrollAreaRef = React.useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        '[data-radix-scroll-area-viewport]'
      )
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])

  const addClientContext = (selectedClient: ClientHomePage) => {
    const clientItem: ContextItem = {
      id: `client-${selectedClient.id}`,
      type: 'client',
      label: selectedClient.firstName,
      data: selectedClient,
    }
    setContextItems((prev) => {
      // Remove any existing client context first
      const filtered = prev.filter((item) => item.type !== 'client')
      return [...filtered, clientItem]
    })
  }

  const addExercisesContext = () => {
    // When adding the exercise context we want ALL library exercises selected by default
    const allExercisesSelected = initialExercises

    // Update local state so the dialog opens with everything pre-selected
    setExercises(allExercisesSelected)

    const exerciseItem: ContextItem = {
      id: 'exercises-preferred',
      type: 'exercises',
      label: `${allExercisesSelected.length} Preferred Exercises`,
      data: allExercisesSelected,
    }

    setContextItems((prev) => {
      // Remove any existing exercise context first
      const filtered = prev.filter((item) => item.type !== 'exercises')
      return [...filtered, exerciseItem]
    })
  }

  const handleExercisesChange = (newExercises: Exercise[]) => {
    setExercises(newExercises)
    // Update context item if it exists
    setContextItems((prev) => {
      return prev.map((item) => {
        if (item.type === 'exercises') {
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
      case 'client':
        return <UserIcon className="size-3" />
      case 'exercises':
        return <Dumbbell className="size-3" />
      default:
        return null
    }
  }

  const renderContextBadge = (item: ContextItem) => {
    if (item.type === 'exercises') {
      return (
        <ExerciseSelectionDialog
          key={item.id}
          exercises={exercises}
          setExercises={handleExercisesChange}
          allExercises={initialExercises}
          selectedExercises={exercises}
        >
          <Badge
            variant="secondary"
            className="flex cursor-pointer items-center gap-1 text-xs"
          >
            {getContextIcon(item.type)}
            <span>{item.label}</span>
            <Button
              variant="ghost"
              size="noSize"
              className="hover:bg-transparent"
              onClick={(e) => {
                e.stopPropagation()
                removeContextItem(item.id)
              }}
            >
              <X className="size-3" />
            </Button>
          </Badge>
        </ExerciseSelectionDialog>
      )
    }

    return (
      <Badge
        key={item.id}
        variant="secondary"
        className="flex items-center gap-1 text-xs"
      >
        {getContextIcon(item.type)}
        <span>{item.label}</span>
        <Button
          variant="ghost"
          size="noSize"
          className="hover:bg-transparent"
          onClick={() => removeContextItem(item.id)}
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
          <h3 className="text-muted-foreground text-lg font-normal tracking-wide uppercase">
            Chat
          </h3>
        </div>
      </SidebarHeader>
      <SidebarContent className="flex flex-col">
        {/* Chat Messages Area */}
        <div className="flex min-h-0 flex-1 flex-col">
          <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
            <div className="space-y-4 py-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-3',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="size-8 shrink-0">
                      <AvatarFallback className="border-input bg-primary-foreground text-primary border">
                        <Icons.sparkles className="size-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}

                  {message.role === 'assistant' && (
                    <div className="text-primary flex flex-col gap-2 text-sm leading-relaxed">
                      {message.content}
                    </div>
                  )}

                  {message.role === 'user' && (
                    <div className="bg-primary text-primary-foreground ml-auto max-w-[80%] rounded-lg px-3 py-2 text-sm leading-relaxed">
                      {message.content}
                    </div>
                  )}
                </div>
              ))}

              {status === 'submitted' && (
                <div className="rounded-lg px-3 py-2 text-sm">
                  <div className="flex animate-pulse items-center gap-2">
                    <span className="text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </SidebarContent>

      <SidebarFooter>
        <div className="space-y-3 px-4 pb-2">
          <form onSubmit={handleSubmit} className="relative flex gap-2">
            <div className="absolute top-3 left-3">
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="xs"
                      className="text-muted-foreground"
                    >
                      <Plus className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    {availableClients.length > 0 && (
                      <>
                        <div className="text-muted-foreground px-2 py-1.5 text-xs font-medium">
                          Clients
                        </div>
                        {availableClients.map((availableClient) => (
                          <DropdownMenuItem
                            key={availableClient.id}
                            onClick={() => addClientContext(availableClient)}
                            disabled={contextItems.some(
                              (item) =>
                                item.type === 'client' &&
                                item.data.id === availableClient.id
                            )}
                          >
                            <UserIcon className="mr-2 size-4" />
                            {availableClient.firstName}
                          </DropdownMenuItem>
                        ))}
                        <Separator className="my-1" />
                      </>
                    )}
                    <div className="text-muted-foreground px-2 py-1.5 text-xs font-medium">
                      Exercise Library
                    </div>
                    <DropdownMenuItem
                      onClick={addExercisesContext}
                      disabled={contextItems.some(
                        (item) => item.type === 'exercises'
                      )}
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
              value={input}
              onChange={handleInputChange}
              placeholder="Ask me to build your program..."
              className="min-h-[80px] resize-none pt-12 pb-14 text-sm"
              disabled={status === 'streaming'}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
            />
            <div className="absolute right-3 bottom-3">
              <Button
                type="submit"
                size="noSize"
                disabled={status === 'streaming' || !input.trim()}
                className="shrink-0 rounded-full p-1.5"
              >
                <Icons.send className="size-4" />
              </Button>
            </div>
          </form>
          <p className="text-muted-foreground text-center text-xs">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
