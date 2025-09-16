import { streamObject, tool } from "ai"
import { stripIndents } from "common-tags"
import { z } from "zod"
import type { Workout } from "@/lib/domain/workouts"
import { log } from "@/lib/logger/logger"
import type { ExercisesContextData } from "../../prompts/context-schema"
import {
  buildExercisesContext,
  buildWorkoutContext,
} from "../../prompts/prompts"
import { gatewayProviders } from "../../providers"
import type { MyToolArgs } from "../../ui-message-types"
import {
  type EditWorkoutPlanActions,
  editWorkoutPlanActionsSchema,
} from "./schemas"

const streamObjectSystemPrompt = stripIndents`
You are an assistant that translates a free-form, natural-language plan edit request into a
validated JSON array of plan-level operations. You will receive the current plan (with workout ids)
and the list of supported exercises (with ids). Your job is to produce operation batches that conform
to the provided schema. Output ONLY JSON elements; no prose or markdown.

Critical requirements
- Every inserted exercise MUST be matched to a real, provided exercise and reference its id.
  Never invent exercises or ids. If the request names an unavailable exercise, select the closest
  supported option by exact/synonym/sub-string match and use that exercise's canonical name and id from the list.
- When the request references a workout by position (e.g., "Day 2"), map via workout.program_order.
  When it references by name, match case-insensitively to an existingworkout.name.
  All operations MUST reference workouts by their UUID fields (anchorWorkoutId, workoutId, aWorkoutId, bWorkoutId).
- Allowed operations only: insertAfter, insertBefore, insertAtStart, insertAtEnd, swap, remove. Do not modify blocks inside existing workouts here.
- For inserted workouts, construct blocks using the schemas below. Use the exercises list to populate exercise ids and canonical names. Use compact metadata strings.

Block shapes
<EXERCISE_BLOCK_EXAMPLE>
{
  "type": "exercise",
  "exercise": {
    "id": "<uuid from exercises list>",
    "name": "<canonical name from exercises list>",
    "metadata": {
      "sets": "3",
      "reps": "10-12",
      "weight": "BW+10",
      "rest": "90s",
      "notes": "optional"
    }
  }
}
</EXERCISE_BLOCK_EXAMPLE>

<CIRCUIT_BLOCK_EXAMPLE>
{
  "type": "circuit",
  "circuit": {
    "name": "A1/A2",
    "description": "optional",
    "metadata": { "sets": "3", "rest": "60s", "notes": "optional" },
    "exercises": [ <exercise blocks as above> ]
  }
}
</CIRCUIT_BLOCK_EXAMPLE>

Metadata formats
- sets/reps: "12", "12, 10, 8", or ranges like "10-12"
- weight: numeric or BW/BW+10
- rest: "30s", "1m", "2m30s"

Output protocol
- Stream an array where each element is one JSON object matching { "operations": [ ... ] } per schema. No extra fields, comments, or explanations.

Context will follow in sections. Use the JSON section for ids when constructing operations; the text section is provided to aid interpretation only.
`

const toolDescription = stripIndents`
Translate a free-form request describing edits to the workout program into a validated list of plan-level operations that can be applied in order.

Use this when adding, removing, or reordering entire workouts (days). For edits inside an existing workout (blocks/exercises),
use the dedicated generateProgramDiffs tool instead.

Input
- editDescription: Natural-language description of the requested changes 
(e.g., "Add a full-body day at the end with ...; remove the recovery day; swap Day 2 with Day 4").

This tool supports inserting at the start or end of the plan, inserting before or after a specific workout, swapping two workouts, and removing a workout.

Output
- Natural-language description of whether the requested changes were applied successfully.
`
const toolInputSchema = z.object({
  editDescription: z
    .string()
    .describe(
      "A text description of the new workouts to add to the workout program"
    ),
})
const toolOutputSchema = z.string()

const buildStreamObjectSystemPrompt = (
  existingWorkouts: Workout[],
  exercisesContextData: ExercisesContextData
) => {
  return stripIndents`
${streamObjectSystemPrompt}

<CURRENT_WORKOUTS_JSON>
${JSON.stringify(existingWorkouts, null, 2)}
</CURRENT_WORKOUTS_JSON>

<CURRENT_WORKOUTS_TEXT>
${buildWorkoutContext(existingWorkouts)}
</CURRENT_WORKOUTS_TEXT>

${buildExercisesContext(exercisesContextData, { includeIDs: true })}
  `
}

export const editWorkoutProgramTool = ({
  existingWorkouts,
  contextItems,
  writer,
}: MyToolArgs) => {
  return tool({
    description: toolDescription,
    inputSchema: toolInputSchema,
    outputSchema: toolOutputSchema,
    execute: async ({ editDescription }) => {
      log.consoleWithHeader(
        "Edit workout program tool called with prompt:",
        editDescription
      )
      const builtSystemPrompt = buildStreamObjectSystemPrompt(
        existingWorkouts,
        contextItems.find((item) => item.type === "exercises")
          ?.data as ExercisesContextData
      )
      log.consoleWithHeader("Built system prompt:", builtSystemPrompt)
      try {
        const { elementStream } = streamObject({
          model: gatewayProviders["chat-model"],
          schema: editWorkoutPlanActionsSchema,
          output: "array",
          system: builtSystemPrompt,
          prompt: editDescription,
          onError: (error) => {
            log.error(
              "Workout plan edit operation generation caught error:",
              error
            )
          },
        })

        const allOperations: EditWorkoutPlanActions[] = []
        for await (const element of elementStream) {
          const workoutParsed = editWorkoutPlanActionsSchema.safeParse(element)
          if (!workoutParsed.success) {
            log.error(
              "Workout plan edit operation generation caught error:",
              workoutParsed.error
            )
            continue
          }
          log.consoleWithHeader(
            "Workout plan edit operation created:",
            workoutParsed
          )

          allOperations.push(workoutParsed.data)
          console.log("generated valid edit output!", workoutParsed.data)
          writer.write({
            type: "data-editWorkoutPlanActions",
            transient: true,
            data: workoutParsed.data,
          })
        }
        log.consoleWithHeader("Finished elementStream iteration")
        return "The requested changes were applied successfully"
      } catch (error) {
        log.error("Workout plan edit caught error:", error)
      }
    },
  })
}
