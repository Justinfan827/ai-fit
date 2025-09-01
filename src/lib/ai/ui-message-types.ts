import type {
  InferUITools,
  ToolSet,
  UIMessage,
  UIMessageStreamWriter,
} from "ai"
import z from "zod"
import type { Workouts } from "../domain/workouts"
import type { ContextItem } from "./prompts/context-schema"
import { generateNewWorkouts } from "./tools/generateNewWorkouts/fn"
import { aiWorkoutSchema } from "./tools/generateNewWorkouts/response-schema"
import { workoutChangeSchema } from "./tools/generateProgramDiffs/diff-schema"
import { generateProgramDiffs } from "./tools/generateProgramDiffs/generate-program-diffs"

const metadataSchema = z.object({
  someMetadata: z.string(),
})

type MyMetadata = z.infer<typeof metadataSchema>

const dataPartSchema = z.object({
  diff: workoutChangeSchema,
  newWorkouts: aiWorkoutSchema,
})

type MyDataPart = z.infer<typeof dataPartSchema>

export type MyToolArgs = {
  contextItems: ContextItem[]
  existingWorkouts: Workouts
  writer: MyUIMessageStreamWriter
}
export const myTools = (args: MyToolArgs) => {
  return {
    generateProgramDiffs: generateProgramDiffs(args),
    generateNewWorkouts: generateNewWorkouts(args),
  } satisfies ToolSet
}

type MyTools = InferUITools<ReturnType<typeof myTools>>

export type MyUIMessage = UIMessage<MyMetadata, MyDataPart, MyTools>
export type MyUIMessageStreamWriter = UIMessageStreamWriter<MyUIMessage>
