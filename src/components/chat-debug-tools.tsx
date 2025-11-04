"use client"

import { useMutation } from "convex/react"
import { ChevronUp } from "lucide-react"
import { useState } from "react"
import type { MyUIMessage } from "@/lib/ai/ui-message-types"
import { isLive } from "@/lib/utils"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Icons } from "./icons"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Collapsible, CollapsibleContent } from "./ui/collapsible"
import { ScrollArea } from "./ui/scroll-area"
import { Separator } from "./ui/separator"

interface ChatDebugToolsProps {
  chatId?: string
  programId: string
  status: string
  uiMessages: MyUIMessage[]
  error: Error | null
  onMessagesCleared: () => void
}

export function ChatDebugTools({
  chatId,
  programId,
  status,
  uiMessages,
  error,
  onMessagesCleared,
}: ChatDebugToolsProps) {
  const [showDebugMessages, setShowDebugMessages] = useState(false)
  const [isDebugHidden, setIsDebugHidden] = useState(false)
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
    } catch (error) {
      console.error("Failed to clear chat:", error)
    }
  }

  // Don't render in live environment
  if (isLive()) {
    return null
  }

  // When hidden, show only a minimal expand button
  if (isDebugHidden) {
    return (
      <div className="absolute top-5 right-5 z-100">
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
    <Card className="rounded-none border-t-0 border-r-0 border-l-0">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between font-medium text-sm">
          <span>Debug Tools</span>
          <div className="flex gap-2">
            {chatId && (
              <Button
                aria-label="Clear chat history"
                onClick={handleClearChat}
                size="sm"
                type="button"
                variant="destructive"
              >
                Clear Chat
              </Button>
            )}
            <Button
              aria-pressed={showDebugMessages}
              onClick={handleToggleDebugMessages}
              size="sm"
              type="button"
              variant={showDebugMessages ? "default" : "outline"}
            >
              {showDebugMessages ? "Hide Messages" : "Show Messages"}
            </Button>
            <Button
              aria-label="Hide debug tools"
              onClick={handleToggleDebugVisibility}
              size="sm"
              type="button"
              variant="ghost"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        <div className="grid grid-cols-1 gap-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status:</span>
            <Badge
              className="text-xs"
              variant={status === "idle" ? "secondary" : "default"}
            >
              {status}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Messages:</span>
            <Badge className="text-xs" variant="outline">
              {uiMessages.length}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Error:</span>
            <Badge
              className="text-xs"
              variant={error ? "destructive" : "secondary"}
            >
              {error ? "Yes" : "None"}
            </Badge>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-2 text-destructive text-xs">
              {error.message}
            </div>
          )}
        </div>

        <Collapsible
          onOpenChange={setShowDebugMessages}
          open={showDebugMessages}
        >
          <CollapsibleContent>
            <Separator className="mb-3" />
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Messages JSON</h4>
              <ScrollArea className="h-[300px] w-full">
                <Card className="bg-muted/50">
                  <CardContent className="p-3">
                    <pre className="whitespace-pre-wrap break-words font-mono leading-relaxed">
                      {JSON.stringify(uiMessages, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              </ScrollArea>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}
