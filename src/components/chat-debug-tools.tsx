"use client"

import { useMutation } from "convex/react"
import { X } from "lucide-react"
import { useState } from "react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import type { MyUIMessage } from "@/lib/ai/ui-message-types"
import { isLive } from "@/lib/utils"
import { Icons } from "./icons"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import { Collapsible, CollapsibleContent } from "./ui/collapsible"
import { ScrollArea } from "./ui/scroll-area"

interface ChatDebugToolsProps {
  chatId?: string
  status: string
  uiMessages: MyUIMessage[]
  error: Error | null
  onMessagesCleared: () => void
}

export function ChatDebugTools({
  chatId,
  status,
  uiMessages,
  error,
  onMessagesCleared,
}: ChatDebugToolsProps) {
  const [showDebugMessages, setShowDebugMessages] = useState(false)
  const [isDebugHidden, setIsDebugHidden] = useState(true)
  const clearChatMessages = useMutation(api.chats.clearChatMessages)

  const handleToggleDebugMessages = () => {
    setShowDebugMessages((prev) => !prev)
  }

  const handleToggleDebugVisibility = () => {
    setIsDebugHidden((prev) => !prev)
    // Also close debug messages when hiding the section
    if (!isDebugHidden) {
      setShowDebugMessages(false)
    }
  }

  const handleClearChat = async () => {
    if (!chatId) return
    try {
      await clearChatMessages({ chatId: chatId as Id<"chats"> })
      onMessagesCleared()
    } catch (clearError) {
      console.error("Failed to clear chat:", clearError)
    }
  }

  // Don't render in live environment
  if (isLive()) {
    return null
  }

  // When hidden, show only a minimal expand button
  if (isDebugHidden) {
    return (
      <div className="absolute top-4 left-4 z-[100]">
        <Button
          aria-label="Show debug tools"
          className="h-6 w-6 p-0"
          onClick={handleToggleDebugVisibility}
          size="sm"
          type="button"
        >
          <Icons.bug className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  return (
    <>
      {/* Floating resizable debug panel */}
      <div
        className="fixed top-[var(--header-height,64px)] right-[calc(var(--sidebar-width,400px)+1rem)] z-[90] flex min-h-[200px] min-w-[300px] max-w-[800px] resize flex-col overflow-hidden rounded-lg border bg-background/95 shadow-lg backdrop-blur-sm"
        style={{
          height: "90vh",
          width: "50vw",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-2">
          <h3 className="font-medium text-sm">Debug Tools</h3>
          <Button
            aria-label="Hide debug tools"
            className="h-6 w-6 p-0"
            onClick={handleToggleDebugVisibility}
            size="sm"
            type="button"
            variant="ghost"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Compact status row */}
        <div className="flex items-center gap-4 border-b px-4 py-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Status:</span>
            <Badge
              className="text-xs"
              variant={status === "idle" ? "secondary" : "default"}
            >
              {status}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Messages:</span>
            <Badge className="text-xs" variant="outline">
              {uiMessages.length}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Error:</span>
            <Badge
              className="text-xs"
              variant={error ? "destructive" : "secondary"}
            >
              {error ? "Yes" : "None"}
            </Badge>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="border-b bg-destructive/10 px-4 py-2 text-destructive text-xs">
            {error.message}
          </div>
        )}

        {/* JSON Messages - takes remaining space */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Collapsible
            className="flex flex-1 flex-col overflow-hidden"
            onOpenChange={setShowDebugMessages}
            open={showDebugMessages}
          >
            {!showDebugMessages && (
              <div className="flex items-center justify-center p-4">
                <Button
                  aria-pressed={showDebugMessages}
                  onClick={handleToggleDebugMessages}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Show Messages JSON
                </Button>
              </div>
            )}
            <CollapsibleContent className="flex flex-1 flex-col overflow-hidden">
              <div className="flex min-h-0 flex-1 flex-col px-4 py-3">
                <div className="mb-2 flex flex-shrink-0 items-center justify-between">
                  <h4 className="font-medium text-sm">Messages JSON</h4>
                  <Button
                    aria-pressed={showDebugMessages}
                    onClick={handleToggleDebugMessages}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    Hide
                  </Button>
                </div>
                <ScrollArea className="min-h-0 flex-1">
                  <Card className="bg-muted/50">
                    <CardContent className="p-3">
                      <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed">
                        {JSON.stringify(uiMessages, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                </ScrollArea>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Footer with actions */}
        <div className="border-t px-4 py-2">
          {chatId && (
            <Button
              aria-label="Clear chat history"
              className="w-full"
              onClick={handleClearChat}
              size="sm"
              type="button"
              variant="destructive"
            >
              Clear Chat
            </Button>
          )}
        </div>
      </div>
    </>
  )
}
