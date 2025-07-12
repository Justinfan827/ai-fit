import { type CoreMessage, type DataStreamWriter, streamObject, tool } from "ai"
import { v4 as uuidv4 } from "uuid"
import { z } from "zod"
import type { Workouts } from "@/lib/domain/workouts"
import { log } from "@/lib/logger/logger"
import type { ContextItem } from "../prompts/context-schema"
import { buildWorkoutModificationPrompt } from "../prompts/prompts"
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
  dataStream,
}: UpdateWorkoutProgramArgs) => {
  return tool({
    description:
      "Take a text description of a change to the workout program and generate a structured diff of the change to apply to the workout program.",
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
        "Update workout program system prompt:",
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
          const diffParsed = workoutChangeAISchema.safeParse(element)
          if (!diffParsed.success) {
            log.error("Diff generation caught error:", diffParsed.error)
            continue
          }
          // add a uuid to the diff
          const diffWithId = {
            ...diffParsed.data,
            id: uuidv4().toString(),
          }
          log.consoleWithHeader("Suggested diff:", diffWithId)
          dataStream.writeData({
            type: "workout-diff",
            content: diffWithId,
          })
        }
        log.consoleWithHeader("Finished elementStream iteration")
        return "Done generating diff for workout changes."
      } catch (error) {
        log.error("Diff generation caught error:", error)
      }
    },
  })
}
