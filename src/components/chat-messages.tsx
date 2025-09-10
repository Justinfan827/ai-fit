import type { MyUIMessage } from "@/lib/ai/ui-message-types"
import { Message, MessageContent } from "./ai-elements/message"
import { Response } from "./ai-elements/response"
import { Icons } from "./icons"

export function ChatMessages({ messages }: { messages: MyUIMessage[] }) {
  return (
    <>
      {messages.map((message) => (
        <Message from={message.role} key={message.id}>
          {message.parts.map((part, partIdx) => {
            switch (part.type) {
              case "tool-generateProgramDiffs":
                // New states for streaming and error handling
                switch (part.state) {
                  case "input-streaming":
                  case "input-available":
                    return (
                      <div
                        className="flex animate-pulse items-center gap-2 text-muted-foreground"
                        key={part.toolCallId}
                      >
                        <Icons.wrench className="size-3" />
                        <span>Generating changes...</span>
                      </div>
                    )
                  case "output-error":
                    return (
                      <div key={part.toolCallId}>Error: {part.errorText}</div>
                    )
                  default:
                    return null
                }
              case "text":
                return (
                  <MessageContent key={`${message.id}-${partIdx}`}>
                    <Response>{part.text}</Response>
                  </MessageContent>
                )
              default:
                return null
            }
          })}
        </Message>
      ))}
    </>
  )
}
