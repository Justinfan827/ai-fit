import {
  type CoreMessage,
  type DataStreamWriter,
  generateText,
  type JSONValue,
  streamObject,
  tool,
} from "ai"
import { z } from "zod"
import type { Workouts } from "@/lib/domain/workouts"
import log from "@/lib/logger/logger"
import type { ContextItem } from "../prompts/context-schema"
import {
  buildDiffGenerationPrompt,
  buildWorkoutModificationPrompt,
} from "../prompts/prompts"
import { myProvider } from "../providers"
import { workoutChangeAISchema } from "./diff-schema"

interface UpdateWorkoutProgramArgs {
  messages: CoreMessage[]
  contextItems: ContextItem[]
  existingWorkouts: Workouts
  dataStream: DataStreamWriter
}

export const updateWorkoutProgram = ({
  existingWorkouts,
  contextItems,
  messages,
  dataStream,
}: UpdateWorkoutProgramArgs) => {
  return tool({
    description: "Suggest new exercises to add to an existing workout program",
    parameters: z.object({
      suggestedChangeText: z
        .string()
        .describe(
          "A text description of the change to make to the workout program."
        ),
    }),
    execute: async ({ suggestedChangeText }) => {
      const systemPrompt = buildWorkoutModificationPrompt(
        contextItems,
        existingWorkouts
      )
      log.consoleWithHeader("Suggested change text:", suggestedChangeText)
      log.consoleWithHeader(
        "Create workout changes tool: system prompt",
        systemPrompt
      )

      try {
        // Step 2: Convert text changes to structured diff
        const { elementStream } = streamObject({
          model: myProvider.languageModel("chat-model"),
          schema: workoutChangeAISchema,
          output: "array",
          system: systemPrompt,
          prompt: suggestedChangeText,
          onError: (error) => {
            log.error("Diff generation caught error:", error)
          },
        })
        log.consoleWithHeader("Diff generation streaming.")

        for await (const element of elementStream) {
          log.consoleWithHeader("Suggested diff:", element)
          dataStream.writeData({
            type: "workout-diff",
            content: element as JSONValue,
          })
        }
        log.consoleWithHeader("Finished elementStream iteration")
        return (
          "Done creating workout changes. Updated workout text: " +
          updatedWorkoutText
        )
      } catch (error) {
        log.error("Diff generation caught error:", error)
      }
    },
  })
}
