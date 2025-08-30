import { streamObject } from "ai"
import { buildWorkoutModificationPrompt } from "@/lib/ai/prompts/prompts"
import { myProvider } from "@/lib/ai/providers"
import { workoutChangeAISchema } from "@/lib/ai/tools/diff-schema"
import log from "@/lib/logger/logger"
import { testExercises, testWorkouts } from "../../../../scripts/testdata"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(_req: Request) {
  const prompt = "generate a workout diff for the following changes"
  log.consoleWithHeader("Prompt:", prompt)
  const updateWorkoutProgramPrompt = buildWorkoutModificationPrompt(
    testExercises,
    testWorkouts
  )

  log.consoleWithHeader(
    "Update workout program prompt:",
    updateWorkoutProgramPrompt
  )
  const { elementStream } = streamObject({
    model: myProvider.languageModel("chat-model"),
    schema: workoutChangeAISchema,
    output: "array",
    system: updateWorkoutProgramPrompt,
    prompt,
    onError: (error) => {
      log.error("Diff generation caught error:", error)
    },
  })
  log.consoleWithHeader("Diff generation streaming.")

  log.consoleWithHeader("Result:")
  for await (const element of elementStream) {
    log.console(element)
  }

  return new Response("done")
}
