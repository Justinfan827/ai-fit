import type {
  InferUITools,
  ToolSet,
  UIMessage,
  UIMessageStreamWriter,
} from "ai"
import z from "zod"
import type { Workouts } from "../domain/workouts"
import type { ContextItem } from "./prompts/context-schema"
import { workoutChangeSchema } from "./tools/diff-schema"
import { updateWorkoutProgram } from "./tools/update-workout-program"

const metadataSchema = z.object({
  someMetadata: z.string(),
})

type MyMetadata = z.infer<typeof metadataSchema>

const dataPartSchema = z.object({
  diff: workoutChangeSchema,
})

type MyDataPart = z.infer<typeof dataPartSchema>

export type MyToolArgs = {
  contextItems: ContextItem[]
  existingWorkouts: Workouts
  writer: MyUIMessageStreamWriter
}
export const myTools = (args: MyToolArgs) => {
  return {
    updateWorkoutProgram: updateWorkoutProgram(args),
  } satisfies ToolSet
}

type MyTools = InferUITools<ReturnType<typeof myTools>>

export type MyUIMessage = UIMessage<MyMetadata, MyDataPart, MyTools>
export type MyUIMessageStreamWriter = UIMessageStreamWriter<MyUIMessage>
