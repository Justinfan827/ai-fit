'use client'

import { useChat } from '@ai-sdk/react'
import { Bot, Send, Sparkles, User } from 'lucide-react'
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
import { Tp } from './typography'
import { Avatar, AvatarFallback } from './ui/avatar'
import { Button } from './ui/button'
import { Card, CardHeader } from './ui/card'
import { ScrollArea } from './ui/scroll-area'
import { Separator } from './ui/separator'
import { Textarea } from './ui/textarea'

interface ProgramEditorSidebarProps
  extends React.ComponentProps<typeof Sidebar> {
  trainerId: string
  exercises: Exercise[]
  client: ClientHomePage
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export function ProgramEditorSidebar({
  exercises,
  trainerId,
  client,
  ...props
}: ProgramEditorSidebarProps) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: '/api/chat',
      body: {
        clientContext: {
          id: client.id,
          firstName: client.firstName,
          age: client.age,
          weightKg: client.weightKg,
          heightCm: client.heightCm,
          liftingExperienceMonths: client.liftingExperienceMonths,
          gender: client.gender,
          details: client.details,
        },
      },
      initialMessages: [
        {
          id: 'welcome',
          role: 'assistant',
          content: `Hi! I'm here to help you create the perfect workout program for ${client.firstName}. I can see their profile information and details. What would you like to focus on for their training program?`,
        },
      ],
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

  const basicInfo = [
    { name: 'Age', value: client.age },
    { name: 'Weight', value: client.weightKg },
    { name: 'Height', value: client.heightCm },
    {
      name: 'Lifting Experience',
      value: client.liftingExperienceMonths
        ? `${client.liftingExperienceMonths} months`
        : 'Not specified',
    },
    { name: 'Gender', value: client.gender },
  ]

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="px-4">
          <Tp variant="h3">{client.firstName}</Tp>
          <p className="text-muted-foreground text-sm">AI Fitness Coach</p>
        </div>
        <Separator className="mt-2" />
      </SidebarHeader>

      <SidebarContent className="flex flex-col">
        {/* Client Profile Section - Collapsible */}
        <div className="px-4 py-2">
          <details className="group">
            <summary className="flex cursor-pointer items-center justify-between py-2 text-sm font-medium">
              Profile Overview
              <span className="transition-transform group-open:rotate-90">
                ▶
              </span>
            </summary>
            <div className="space-y-2 pt-2">
              {basicInfo.map(({ name, value }) => (
                <div key={name} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{name}</span>
                  <span>{value || 'Not specified'}</span>
                </div>
              ))}
              {client.details.length > 0 && (
                <div className="pt-2">
                  <p className="mb-1 text-xs font-medium">Details:</p>
                  {client.details.map((detail) => (
                    <Card key={detail.id} className="mb-2">
                      <CardHeader className="p-2">
                        <p className="text-xs font-medium">{detail.title}</p>
                        <p className="text-muted-foreground text-xs leading-relaxed whitespace-pre-wrap">
                          {detail.description}
                        </p>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </details>
        </div>

        <Separator />

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
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="size-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div
                    className={cn(
                      'max-w-[80%] rounded-lg px-3 py-2 text-sm leading-relaxed',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground ml-auto'
                        : 'bg-muted'
                    )}
                  >
                    {message.content}
                  </div>

                  {message.role === 'user' && (
                    <Avatar className="size-8 shrink-0">
                      <AvatarFallback className="bg-secondary">
                        <User className="size-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start gap-3">
                  <Avatar className="size-8 shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="size-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg px-3 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-3 animate-pulse" />
                      <span>Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </SidebarContent>

      <SidebarFooter>
        <div className="px-4 pb-2">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Textarea
              value={input}
              onChange={handleInputChange}
              placeholder="Ask about workout programs, exercises, or training advice..."
              className="min-h-[80px] resize-none text-sm"
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
            />
            <Button
              type="submit"
              size="sm"
              disabled={isLoading || !input.trim()}
              className="shrink-0"
            >
              <Send className="size-4" />
            </Button>
          </form>
          <p className="text-muted-foreground mt-2 text-center text-xs">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
