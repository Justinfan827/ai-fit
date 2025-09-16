import type { MyUIMessage } from "@/lib/ai/ui-message-types"
import { Message, MessageContent } from "./ai-elements/message"
import { Response } from "./ai-elements/response"
import { Icons } from "./icons"

function GeneratingChanges({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex animate-pulse items-center gap-2 text-muted-foreground">
      <Icons.wrench className="size-3" />
      <span>{children}</span>
    </div>
  )
}
function ToolError({ errorText }: { errorText: string }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icons.wrench className="size-3" />
      <span>Error: {errorText}</span>
    </div>
  )
}

export function ChatMessages({ messages }: { messages: MyUIMessage[] }) {
  return (
    <>
      {messages.map((message) => (
        <Message from={message.role} key={message.id}>
          <MessageContent>
            {message.parts.map((part, partIdx) => {
              switch (part.type) {
                case "tool-editWorkoutPlan":
                  switch (part.state) {
                    case "input-streaming":
                    case "input-available":
                      return (
                        <GeneratingChanges key={part.toolCallId}>
                          Editing workout plan...
                        </GeneratingChanges>
                      )
                    case "output-error":
                      return (
                        <ToolError
                          errorText={part.errorText}
                          key={part.toolCallId}
                        />
                      )
                    default:
                      return null
                  }
                case "tool-generateProgramDiffs":
                  // New states for streaming and error handling
                  switch (part.state) {
                    case "input-streaming":
                    case "input-available":
                      return (
                        <GeneratingChanges key={part.toolCallId}>
                          Generating changes...
                        </GeneratingChanges>
                      )
                    case "output-error":
                      return (
                        <ToolError
                          errorText={part.errorText}
                          key={part.toolCallId}
                        />
                      )
                    default:
                      return null
                  }
                case "text":
                  return (
                    <Response key={`${message.id}-${partIdx}`}>
                      {part.text}
                    </Response>
                  )
                default:
                  return null
              }
            })}
          </MessageContent>
        </Message>
      ))}
    </>
  )
}
