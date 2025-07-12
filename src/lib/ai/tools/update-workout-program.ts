import {
  type CoreMessage,
  type DataStreamWriter,
  generateText,
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
import { workoutChangeSchemaAI } from "./diff-schema"

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
    parameters: z.object({}),
    execute: async () => {
      const systemPrompt = buildWorkoutModificationPrompt(
        contextItems,
        existingWorkouts
      )
      log.consoleWithHeader(
        "Create workout changes tool: system prompt",
        systemPrompt
      )

      // TODO: collapse into one?
      const { text: updatedWorkoutText } = await generateText({
        model: myProvider.languageModel("chat-model"),
        system: systemPrompt,
        messages,
      })

      log.consoleWithHeader(
        "Create workout changes tool: updated workout text",
        updatedWorkoutText
      )

      const diffGenerationSystemPrompt = buildDiffGenerationPrompt(
        existingWorkouts,
        updatedWorkoutText
      )
      const diffGenerationPrompt =
        "generate a workout diff for the following changes"

      log.consoleWithHeader(
        "Create workout changes tool: diff generation system prompt",
        diffGenerationSystemPrompt
      )
      log.consoleWithHeader(
        "Create workout changes tool: diff generation prompt",
        diffGenerationPrompt
      )
      try {
        // Step 2: Convert text changes to structured diff
        const { elementStream } = streamObject({
          model: myProvider.languageModel("chat-model"),
          schema: workoutChangeSchemaAI,
          output: "array",
          system: diffGenerationSystemPrompt,
          prompt: diffGenerationPrompt,
          onError: (error) => {
            log.error("Diff generation caught error:", error)
          },
        })
        log.consoleWithHeader("Diff generation streaming.")

        for await (const element of elementStream) {
          log.consoleWithHeader("Suggested diff:", element)
          dataStream.writeData({
            type: "workout-diff",
            content: element,
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
