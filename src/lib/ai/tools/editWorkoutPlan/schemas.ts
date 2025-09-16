import { z } from "zod"
import { aiWorkoutSchema } from "../ai-only-schema"

const insertAfterOpSchema = z
  .object({
    type: z
      .literal("insertAfter")
      .describe("Insert a new workout immediately after the anchor workout"),
    anchorWorkoutId: z
      .uuid()
      .describe("Existing workoutId to insert after (must exist in the plan)"),
    workout: aiWorkoutSchema.describe(
      "The full workout to insert; an id will be assigned if missing"
    ),
  })
  .describe("Insert a workout after a specific workoutId")

const insertBeforeOpSchema = z
  .object({
    type: z
      .literal("insertBefore")
      .describe("Insert a new workout immediately before the anchor workout"),
    anchorWorkoutId: z
      .uuid()
      .describe("Existing workoutId to insert before (must exist in the plan)"),
    workout: aiWorkoutSchema.describe(
      "The full workout to insert; an id will be assigned if missing"
    ),
  })
  .describe("Insert a workout before a specific workoutId")

// New: anchorless inserts
const insertAtStartOpSchema = z
  .object({
    type: z
      .literal("insertAtStart")
      .describe("Insert a workout at the beginning of the plan"),
    workout: aiWorkoutSchema.describe(
      "The full workout to insert; an id will be assigned if missing"
    ),
  })
  .describe("Insert at the start (useful when the plan is empty)")

const insertAtEndOpSchema = z
  .object({
    type: z
      .literal("insertAtEnd")
      .describe("Insert a workout at the end of the plan"),
    workout: aiWorkoutSchema.describe(
      "The full workout to insert; an id will be assigned if missing"
    ),
  })
  .describe("Insert at the end (also valid when the plan is empty)")

const swapOpSchema = z
  .object({
    type: z
      .literal("swap")
      .describe("Swap the positions of two workouts by id"),
    aWorkoutId: z.uuid().describe("First workoutId to swap (must exist)"),
    bWorkoutId: z.uuid().describe("Second workoutId to swap (must exist)"),
  })
  .refine((v) => v.aWorkoutId !== v.bWorkoutId, {
    message: "swap requires two distinct workoutIds",
    path: ["bWorkoutId"],
  })
  .describe("Swap two workouts in the plan")

const removeOpSchema = z
  .object({
    type: z.literal("remove").describe("Remove a workout from the plan by id"),
    workoutId: z.uuid().describe("Existing workoutId to remove"),
  })
  .describe("Remove a workout")

const editOperationSchema = z
  .discriminatedUnion("type", [
    insertAfterOpSchema,
    insertBeforeOpSchema,
    insertAtStartOpSchema,
    insertAtEndOpSchema,
    // TODO: Test swap / rest of the operations
    swapOpSchema,
    removeOpSchema,
  ])
  .describe("An edit operation to apply")

const editWorkoutPlanActionsSchema = z
  .array(editOperationSchema)
  .min(1)
  .describe("Batch of operations to apply sequentially")

type EditWorkoutPlanActions = z.infer<typeof editWorkoutPlanActionsSchema>
type EditWorkoutPlanAction = z.infer<typeof editOperationSchema>
type EditWorkoutPlanInsertAfterAction = z.infer<typeof insertAfterOpSchema>
type EditWorkoutPlanInsertBeforeAction = z.infer<typeof insertBeforeOpSchema>
type EditWorkoutPlanInsertAtStartAction = z.infer<typeof insertAtStartOpSchema>
type EditWorkoutPlanInsertAtEndAction = z.infer<typeof insertAtEndOpSchema>
type EditWorkoutPlanSwapAction = z.infer<typeof swapOpSchema>
type EditWorkoutPlanRemoveAction = z.infer<typeof removeOpSchema>

export {
  editOperationSchema,
  editWorkoutPlanActionsSchema,
  type EditWorkoutPlanAction,
  type EditWorkoutPlanActions,
  type EditWorkoutPlanInsertAfterAction,
  type EditWorkoutPlanInsertBeforeAction,
  type EditWorkoutPlanInsertAtStartAction,
  type EditWorkoutPlanInsertAtEndAction,
  type EditWorkoutPlanSwapAction,
  type EditWorkoutPlanRemoveAction,
}
