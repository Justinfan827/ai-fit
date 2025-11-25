import type {
  InferUITools,
  ToolSet,
  UIMessage,
  UIMessageStreamWriter,
} from "ai"
import z from "zod"
import type { Workouts } from "../domain/workouts"
import type { ContextItem } from "./prompts/context-schema"
import { aiWorkoutSchema } from "./tools/ai-only-schema"
import { editWorkoutProgramTool } from "./tools/editWorkoutPlan/edit-workout-plan-tool"
import { editOperationSchema } from "./tools/editWorkoutPlan/schemas"
import { workoutChangeSchema } from "./tools/generateProgramDiffs/diff-schema"
import { generateProgramDiffs } from "./tools/generateProgramDiffs/generate-program-diffs"

const metadataSchema = z.object({})

type MyMetadata = z.infer<typeof metadataSchema>

const dataPartSchema = z.object({
  diff: workoutChangeSchema,
  newWorkouts: aiWorkoutSchema,
  editWorkoutPlanAction: editOperationSchema,
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
    // generateNewWorkouts: generateNewWorkouts(args),
    editWorkoutPlan: editWorkoutProgramTool(args),
  } satisfies ToolSet
}

type MyTools = InferUITools<ReturnType<typeof myTools>>

export type MyUIMessage = UIMessage<MyMetadata, MyDataPart, MyTools>
export type MyUIMessageStreamWriter = UIMessageStreamWriter<MyUIMessage>
