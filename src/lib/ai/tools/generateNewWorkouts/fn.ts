import { streamObject, tool } from "ai"
import { z } from "zod"
import { log } from "@/lib/logger/logger"
import { buildWorkoutCreationPrompt } from "../../prompts/prompts"
import { myProvider } from "../../providers"
import type { MyToolArgs } from "../../ui-message-types"
import { aiWorkoutSchema } from "./response-schema"

export const generateNewWorkouts = ({
  existingWorkouts,
  contextItems,
  writer,
}: MyToolArgs) => {
  return tool({
    description:
      "Take a text description of a workout program and generate a structured json representation of the workout program that adheres to the provided json schema",
    inputSchema: z.object({
      newWorkoutsText: z
        .string()
        .describe(
          "A text description of the new workouts to add to the workout program"
        ),
    }),
    outputSchema: z.string(),
    execute: async ({ newWorkoutsText }) => {
      const systemPrompt = buildWorkoutCreationPrompt(
        contextItems,
        existingWorkouts
      )
      log.consoleWithHeader(
        "new workouts to create structure for:",
        newWorkoutsText
      )
      log.consoleWithHeader(
        "Create workout program system prompt:",
        systemPrompt
      )

      try {
        const { elementStream } = streamObject({
          model: myProvider.languageModel("chat-model"),
          schema: aiWorkoutSchema,
          output: "array",
          system: systemPrompt,
          prompt: newWorkoutsText,
          onError: (error) => {
            log.error("Workout generation caught error:", error)
          },
        })
        log.console("Workout generation streaming.")

        for await (const element of elementStream) {
          const workoutParsed = aiWorkoutSchema.safeParse(element)
          if (!workoutParsed.success) {
            log.error("Workout generation caught error:", workoutParsed.error)
            continue
          }
          log.consoleWithHeader("Workout created:", workoutParsed)

          writer.write({
            type: "data-newWorkouts",
            transient: true,
            data: workoutParsed.data,
          })
        }
        log.consoleWithHeader("Finished elementStream iteration")
        return "Done generating new workouts"
      } catch (error) {
        log.error("Workout generation caught error:", error)
      }
    },
  })
}
