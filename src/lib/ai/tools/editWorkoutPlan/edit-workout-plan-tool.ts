import { openai } from "@ai-sdk/openai"
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
import type { MyToolArgs } from "../../ui-message-types"
import {
  type EditWorkoutPlanAction,
  type EditWorkoutPlanActions,
  editOperationWrappedSchema,
} from "./schemas"

const streamObjectSystemPrompt = stripIndents`
You are an ai assistant that translates a free-form, natural-language edit requests into a
validated JSON array of edit operations. As inputs, you are given a description of the current workout program, 
a list of supported exercises, and a text description of the requested changes to make. You will be given
the relevant schemas for the JSON response.

# General guidelines for the edit operations
- Every exercise referenced in the edit request MUST be matched to a real, provided exercise and reference its id.
  Never invent exercises or ids. If the request names an unavailable exercise, select the closest
  supported option by exact/synonym/sub-string match and use that exercise's canonical name and id from the list.
- When the request references a workout by position (e.g., "Day 2"), map via workout.program_order.
  When it references by name, match case-insensitively to an existingworkout.name.
  All operations MUST reference workouts by their UUID fields (anchorWorkoutId, workoutId, aWorkoutId, bWorkoutId).
- Allowed operations only: insertAfter, insertBefore, insertAtStart, insertAtEnd, swap, remove. DO NOT modify individual blocks inside existing workouts here.
- For newly inserted workouts, make sure the individual blocks adhere to the schemas. Use the exercises list to populate exercise ids
  and canonical names. For exercise details, MAKE SURE to follow the training variables and notation as described below.
- For the 'notes' field in the structured response, ALWAYS return a string. If there are no notes, just return an empty string.

# Explaining an edit operation:

An edit operation type is determined by the operationToUse field. The valid values are:
- insertAfter
- insertBefore
- insertAtStart
- insertAtEnd
- swap
- remove

If the operationToUse is insertAfter, insertBefore, insertAtStart, or insertAtEnd, the corresponding field will be populated.
For example, if the operationToUse is insertAfter, the insertAfter field will be populated. If the operationToUse is swap, 
the swap field will be populated. If the operationToUse is remove, the remove field will be populated:

## Examples of valid edit operations
{ "operationToUse": "swap", "swap": { "aWorkoutId": "<uuid>", "bWorkoutId": "<uuid>" } }
{ "operationToUse": "remove", "remove": { "workoutId": "<uuid>" } }
{ "operationToUse": "insertAtStart", "insertAtStart": { "workout": "<workout to insert>" } }
{ "operationToUse": "insertAtEnd", "insertAtEnd": { "workout": "<workout to insert>" } }
{ "operationToUse": "insertBefore", "insertBefore": { "anchorWorkoutId": "<uuid>", "workout": "<workout to insert>" } }
 { "operationToUse": "insertAfter", "insertAfter": { "anchorWorkoutId": "<uuid>", "workout": "<workout to insert>" } }

# Training variables and notation
- Reps and weights can be represented as:
  - Comma separated values e.g. "12, 10, 8"
  - Ranges e.g. "10-12"
  - Range and comma values e.g. "10-12, 10-16, 8-10"
- The "Each Side" (ES or E/S) annotation is used to represent exercises that are performed on each side. e.g. 12ES, 12-15E/S
- Rest periods use the "s" suffix to represent seconds, "m" to represent minutes e.g. "30s", "1m", "2m30s"
- Weight can be represented as:
  - Numeric values e.g. "135"
  - Bodyweight (BW) e.g. "BW"
  - Bodyweight plus a value e.g. "BW+10"
  - Bodyweight plus a range e.g. "BW+10-20"
  - Bodyweight plus a range and a comma separated values e.g. "BW+10-20"
  - Weight units default to lbs, unless coach preferences specify otherwise.
- Exercise circuits are represented using the "A1,A2,A3...An" notation. E.g. a circuit with 3 exercises would be represented as 
  "A1:Exercise1,A2:Exercise2,A3:Exercise3".
- AMRAP is a special notation for exercises that are performed "As Many Reps As Possible".

# Example block schemas

## Exercise block example
{
  "type": "exercise",
  "exercise": {
    "id": "<uuid from exercises list>",
    "name": "<canonical name from exercises list>",
    "metadata": {
      "sets": "3",
      "reps": "10,10-12,10-15",
      "weight": "BW+10-20",
      "rest": "1m30s",
      "notes": "This is a note about the exercise"
    }
  }
}

## Circuit block example
{
  "type": "circuit",
  "circuit": {
    "name": "Circuit 1",
    "description": "This is a description of the circuit",
    "metadata": { "sets": "3", "rest": "1m", "notes": "This is a note about the circuit" },
    "exercises": [ <exercise blocks as above> ]
  }
}
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

# Current workout program
${buildWorkoutContext(existingWorkouts, { includeIDs: true })}

# Exercise list
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
          model: openai("gpt-4.1-mini"),
          // Note that we use the 'wrapped' schema here because openai
          // does not support discriminated unions at the root level
          // https://platform.openai.com/docs/guides/structured-outputs/root-objects-must-not-be-anyof#root-objects-must-not-be-anyof-and-must-be-an-object
          schema: editOperationWrappedSchema,
          output: "array",
          system: builtSystemPrompt,
          prompt: editDescription,
          onFinish: ({ response }) => {
            log.consoleWithHeader(
              "Workout plan edit operation generation finished:"
            )
            log.consoleJSON(response)
          },
          onError: (error) => {
            log.error(
              "Workout plan edit operation generation caught error:",
              error
            )
          },
        })

        const allOperations: EditWorkoutPlanActions = []
        for await (const element of elementStream) {
          const editOperationWrappedParsed =
            editOperationWrappedSchema.safeParse(element)
          if (!editOperationWrappedParsed.success) {
            log.error(
              "Workout plan edit operation generation caught error:",
              editOperationWrappedParsed.error
            )
            continue
          }
          log.consoleWithHeader(
            "Workout plan edit operation created:",
            editOperationWrappedParsed
          )

          const operation = editOperationWrappedParsed.data.operationToUse
          const editOperation = editOperationWrappedParsed.data[operation]
          if (!editOperation) {
            log.error(
              "Workout plan edit operation generation caught error:",
              `No operation found for ${operation}`
            )
            continue
          }
          const completeOperation = {
            ...editOperation,
            type: operation,
          } as EditWorkoutPlanAction
          allOperations.push(completeOperation)
          writer.write({
            type: "data-editWorkoutPlanAction",
            transient: true,
            data: completeOperation,
          })
        }
        log.console("Finished elementStream iteration")
        if (allOperations.length === 0) {
          return "No operations were generated. Something likely went wrong with the request."
        }
        return stripIndents`Suggest operations were transformed into JSON successfully. 
        The client might not have chosen to apply the suggested operations. Refer to the system prompt for the current
        state of the workout program`
      } catch (error) {
        log.error("Workout plan edit caught error:", error)
      }
    },
  })
}
