import { z } from "zod"
import { aiWorkoutSchema } from "../ai-only-schema"

const insertAfterOpName = z.literal("insertAfter")
const insertBeforeOpName = z.literal("insertBefore")
const insertAtStartOpName = z.literal("insertAtStart")
const insertAtEndOpName = z.literal("insertAtEnd")
const swapOpName = z.literal("swap")
const removeOpName = z.literal("remove")
const availableOpNames = z.union([
  insertAfterOpName,
  insertBeforeOpName,
  insertAtStartOpName,
  insertAtEndOpName,
  swapOpName,
  removeOpName,
])

const insertAfterOpSchema = z
  .object({
    type: insertAfterOpName.describe(
      "Insert a new workout immediately after the anchor workout"
    ),
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
    type: insertBeforeOpName.describe(
      "Insert a new workout immediately before the anchor workout"
    ),
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
    type: insertAtStartOpName.describe(
      "Insert a workout at the beginning of the plan"
    ),
    workout: aiWorkoutSchema.describe(
      "The full workout to insert; an id will be assigned if missing"
    ),
  })
  .describe("Insert at the start (useful when the plan is empty)")

const insertAtEndOpSchema = z
  .object({
    type: insertAtEndOpName.describe("Insert a workout at the end of the plan"),
    workout: aiWorkoutSchema.describe(
      "The full workout to insert; an id will be assigned if missing"
    ),
  })
  .describe("Insert at the end (also valid when the plan is empty)")

const swapOpSchema = z
  .object({
    type: swapOpName.describe("Swap the positions of two workouts by id"),
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
    type: removeOpName.describe("Remove a workout from the plan by id"),
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

// root object must not be anyof and must be an object
// https://platform.openai.com/docs/guides/structured-outputs/root-objects-must-not-be-anyof#root-objects-must-not-be-anyof-and-must-be-an-object
const editOperationWrappedSchema = z.object({
  operationToUse: availableOpNames,
  // these must match availableOpNames
  insertAfter: insertAfterOpSchema.nullable(),
  insertBefore: insertBeforeOpSchema.nullable(),
  insertAtStart: insertAtStartOpSchema.nullable(),
  insertAtEnd: insertAtEndOpSchema.nullable(),
  swap: swapOpSchema.nullable(),
  remove: removeOpSchema.nullable(),
})

const editWorkoutPlanActionsSchema = z
  .array(editOperationSchema)
  .min(1)
  .describe("Batch of operations to apply sequentially")

type EditWorkoutPlanActions = z.infer<typeof editWorkoutPlanActionsSchema>
type EditWorkoutPlanActionWrapped = z.infer<typeof editOperationWrappedSchema>
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
  editOperationWrappedSchema,
  type EditWorkoutPlanAction,
  type EditWorkoutPlanActions,
  type EditWorkoutPlanInsertAfterAction,
  type EditWorkoutPlanInsertBeforeAction,
  type EditWorkoutPlanInsertAtStartAction,
  type EditWorkoutPlanInsertAtEndAction,
  type EditWorkoutPlanSwapAction,
  type EditWorkoutPlanRemoveAction,
  type EditWorkoutPlanActionWrapped,
}
