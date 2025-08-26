import { streamObject, tool } from "ai"
import { v4 as uuidv4 } from "uuid"
import { z } from "zod"
import { log } from "@/lib/logger/logger"
import { buildWorkoutModificationPrompt } from "../prompts/prompts"
import { myProvider } from "../providers"
import type { MyToolArgs } from "../ui-message-types"
import { workoutChangeAISchema } from "./diff-schema"

export const updateWorkoutProgram = ({
  existingWorkouts,
  contextItems,
  writer,
}: MyToolArgs) => {
  return tool({
    description:
      "Take a text description of a change to the workout program and generate a structured diff of the change to apply to the workout program.",
    inputSchema: z.object({
      suggestedChangeText: z
        .string()
        .describe(
          "A text description of the change to make to the workout program."
        ),
    }),
    outputSchema: z.string(),
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
          const diffWithId = {
            ...diffParsed.data,
            // add a uuid to the diff
            id: uuidv4().toString(),
          }
          log.consoleWithHeader("Suggested diff:", diffWithId)
          writer.write({
            type: "data-diff",
            transient: true,
            data: diffWithId,
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
