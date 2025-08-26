import { v4 as uuidv4 } from "uuid"
import type { MyUIMessage } from "./ui-message-types"

export const testMessage: MyUIMessage[] = [
  {
    id: uuidv4(),
    role: "assistant",
    parts: [
      {
        type: "text",
        text: "Hello there! Ask me anything",
      },
    ],
  },
  {
    id: uuidv4(),
    role: "user",
    parts: [
      {
        type: "text",
        text: "Hello there! I am the user",
      },
    ],
  },
  {
    id: uuidv4(),
    role: "assistant",
    parts: [
      {
        output: "done",
        state: "output-available",
        type: "tool-updateWorkoutProgram",
        input: {
          suggestedChangeText: "This is the diff",
        },
        toolCallId: uuidv4(),
      },
    ],
  },
]
