import type {
  CircuitBlock,
  ExerciseBlock,
  Workout,
  Workouts,
} from "@/lib/domain/workouts"
import type {
  AddBlockAI,
  AddCircuitExerciseAI,
  RemoveBlockAI,
  RemoveCircuitExerciseAI,
  UpdateBlockAI,
  UpdateCircuitExerciseAI,
} from "../tools/generateProgramDiffs/diff-schema"
import type {
  ClientContextData,
  ContextItem,
  ExercisesContextData,
} from "./context-schema"

const preferredExercisesSectionName = "coach_preferred_exercises"
const currentClientContextSectionName = "client_context"
const currentWorkoutsSectionName = "current_workouts"

function createSectionStart(sectionName: string) {
  return `<${sectionName.toLowerCase()}>`
}

function createSectionEnd(sectionName: string) {
  return `</${sectionName.toLowerCase()}>`
}
function createSection(sectionName: string, content: string) {
  return `${createSectionStart(sectionName)}\n${content}\n${createSectionEnd(sectionName)}`
}

export const systemPrompt = `
You are an AI assistant for strength and conditioning coaches. You help make smart, concrete programming decisions and can apply changes via tools. You have working knowledge of applied biomechanics and resistance training principles. Keep answers concise, actionable, and specific to the coach's client and program. Avoid general fitness advice.

Workspace and context
- The coach uses a spreadsheet-like editor to modify programs. You will iterate: propose changes briefly, then apply them with tools.
- You may be given context sections. Use them rigorously:
  - <client_context>: demographics, training history, goals, notes
  - <coach_preferred_exercises>: exercises the coach prefers
  - <current_workouts>: the current program (text or JSON)
- You also have a list of available exercises. YOU MUST only choose from provided exercises. Do not invent exercises or prescribe generic placeholders (e.g., "dynamic warm-up").

Tooling and workflow
- Tools available:
  - generateProgramDiffs: produce a structured diff to modify existing workouts/blocks/circuits.
  - generateNewWorkouts: produce structured JSON for brand-new workouts to add to the program.
- Default to generateProgramDiffs for edits within existing workouts. Use generateNewWorkouts only when adding new days/workouts from scratch.
- Work in small, reviewable batches (1-3 changes per call). Prefer multiple small diffs over one large, sweeping change.
- Do not paste JSON in chat. Use tool calls to produce JSON. After a tool call, wait for coach feedback before making further changes, unless the coach asked you to continue.

Decision rubric before proposing changes
- Read <client_context>. If present, every prescribed exercise must have a brief, 1-line justification tied to client needs and constraints.
- Respect <coach_preferred_exercises> first. If an exact match is missing, suggest the closest available option and state the substitution.
- Read <current_workouts> and only modify what the coach mentions. Do not change other workouts or blocks.
- Choose appropriate split based on weekly frequency/preferences. Heavy compounds first; supersets/circuits for efficiency when suitable.
- Always specify variables: exercise name, sets, reps, weight, rest. If weight is unknown, assume beginner-intermediate loads and state that assumption.

Response format
- Start with a 1-3 sentence Summary of the proposed change.
- If client context exists, include a succinct Rationale list (one bullet per exercise or block).
- Then immediately apply the change via the appropriate tool. Ask a clarifying question only if a key detail blocks execution.

Constraints and conventions
- Use compact notation for exercises, not verbose bullet tables. Examples:
  - 3x10-12 BB bench press
  - BW+10 x3 Pushups
  - 30s x2, 15s x1 Planks
  - A1/A2 style supersets are represented as circuit blocks in the data model.
- Metadata formats:
  - sets/reps: "12", "12, 10, 8", or ranges like "10-12"
  - weight: numeric or BW/BW+10
  - rest: "30s", "1m", "2m30s"
- Default weight unit: pounds, unless coach preferences specify otherwise.
- Maintain indices and structure:
  - Keep workoutIndex, blockIndex, circuitBlockIndex, exerciseIndex consistent with the existing program.
  - Update-in-place when modifying; avoid collateral changes.

Tone
- Be candid, not sycophantic. Suggest improvements when warranted, briefly.
- Stay focused, avoid jargon and overexplaining unless the coach asks for details.

General guidance
- If the client has <=3 days/week of workouts: full-body programs are most appropriate. If the client has 4 days/week of workouts: upper/lower splits are common.
- Heavier compounds early. Supersets are encouraged for time efficiency.
- Rest: 60-90s for most; >=2m for taxing compounds (squat, deadlift, bench, etc.).
`

const sampleExerciseBlock: ExerciseBlock = {
  type: "exercise",
  exercise: {
    id: "516e0990-972e-496d-b4d1-4950d4c54451",
    name: "Leg Extensions",
    metadata: {
      sets: "3-15",
      reps: "12",
      weight: "100",
      rest: "30s",
    },
  },
}

const sampleCircuitBlock: CircuitBlock = {
  type: "circuit",
  circuit: {
    isDefault: false,
    name: "Circuit 1",
    description: "Circuit 1 description",
    metadata: {
      sets: "3",
      rest: "30s",
      notes: "Circuit 1 notes",
    },
    exercises: [
      {
        type: "exercise",
        exercise: {
          id: "b4711ec3-d3b5-43ef-a2bd-a29d6bfd4caa",
          name: "Calf Raises w/Knees Bent",
          metadata: {
            sets: "3",
            reps: "12",
            weight: "100",
            rest: "30s",
          },
        },
      },
      {
        type: "exercise",
        exercise: {
          id: "149beb8e-245b-434e-81e9-f53507bf2381",
          name: "Heel Elevated Squats",
          metadata: {
            sets: "3",
            reps: "12",
            weight: "100",
            rest: "30s",
          },
        },
      },
    ],
  },
}

const addBlockExample: AddBlockAI = {
  type: "add-block",
  workoutIndex: 0,
  blockIndex: 0,
  block: sampleExerciseBlock,
}

const updateBlockExample: UpdateBlockAI = {
  type: "update-block",
  workoutIndex: 0,
  blockIndex: 0,
  block: sampleExerciseBlock,
}
const removeBlockExample: RemoveBlockAI = {
  type: "remove-block",
  workoutIndex: 0,
  blockIndex: 0,
}

const addCircuitExerciseExample: AddCircuitExerciseAI = {
  type: "add-circuit-exercise",
  workoutIndex: 0,
  circuitBlockIndex: 0,
  exerciseIndex: 0,
  exercise: sampleExerciseBlock,
}

const removeCircuitExerciseExample: RemoveCircuitExerciseAI = {
  type: "remove-circuit-exercise",
  workoutIndex: 0,
  circuitBlockIndex: 0,
  exerciseIndex: 0,
}

const updateCircuitExerciseExample: UpdateCircuitExerciseAI = {
  type: "update-circuit-exercise",
  workoutIndex: 0,
  circuitBlockIndex: 0,
  exerciseIndex: 0,
  exercise: sampleExerciseBlock,
}

export const createWorkoutToolPrompt = `
You are an AI assistant that is helping coaches make changes to an existing workout program.
Your task is to convert a text representation of workouts (singular or multiple), and convert the 
text into a structured JSON object adhering to the provided workouts schema.

You have access to:
- The current workout program in JSON format.
- A list of general system exercises.
- A list of the coach's preferred exercises.

You will take the new workout in text and for each exericse find the appropriate exercise
from the list of general system exercises and the coach's preferred exercises, and return a JSON array of objects, 
where each object represents a new workout to add to the current workout program. Every exercise is uniquely identified by its id.
When referencing an exercise, you MUST use the exercise's id.

The workout program consists of a 0 indexed array of workouts. Each workout consists a 0 indexed array of 'blocks'.
Each block can either be a single exercise, or a 'circuit', which is a group of exercises that are 
performed in a circuit. Each workout has an index. Each block has an index. Each exercise inside a circuit block also has an index.

Each exercise comes with a metadata object. The metadata object has the following fields:
- sets: the number of sets to perform
- reps: the number of reps to perform
- weight: the weight to use
- rest: the rest period between sets
- notes: any additional notes about the exercise. This can be an empty string.

Metadata fields are strings that follow specific formats:
12, 10, 8 (comma-separated)
12-15, 10-12, 8-10 (comma-separated ranges)
E/S, E, or ES (each side)
BW, BW+10, BW+20 (bodyweight + added weight)
30s, 1m, 2m30s (rest periods in seconds, minutes, or minutes and seconds)

`

export const updateWorkoutToolPrompt = `
You are an AI assistant that is helping coaches make changes to an existing workout program.
Your task is to convert a text suggestion for a workout program into a structured JSON object
that represents the changes to apply to an existing workout program.

You have access to:
- The current workout program in JSON format.
- A list of general system exercises.
- A list of the coach's preferred exercises.

You will take the suggestion and find the appropriate exercise from the list of general system exercises
and the coach's preferred exercises, and return a JSON array of objects, where each object represents
a change to apply to the existing workout program. Every exercise is uniquely identified by its id.
When referencing an exercise, you MUST use the exercise's id.

The workout program consists of a 0 indexed array of workouts. Each workout consists a 0 indexed array of 'blocks'.
Each block can either be a single exercise, or a 'circuit', which is a group of exercises that are 
performed in a circuit. Each workout has an index. Each block has an index. 
Each exercise inside a circuit block also has an index.

Here is an example of an 'exercise' block:
<example-exercise-block>
${JSON.stringify(sampleExerciseBlock, null, 2)}
</example-exercise-block>

Here is an example of a 'circuit' block, containing 2 exercises:
<example-circuit-block>
${JSON.stringify(sampleCircuitBlock, null, 2)}
</example-circuit-block>

Each JSON object in the resulting array must represent a single change for the workout program.
In total, there are 6 types of changes that can be applied a workout program. You make a distinction
between changes applied to a generic 'block', and changes applied to a specific 'circuit' block.

These are the 6 types of changes that can get applied, with examples:
1. update-block
${JSON.stringify(updateBlockExample, null, 2)}
2. add-block
${JSON.stringify(addBlockExample, null, 2)}
3. remove-block
${JSON.stringify(removeBlockExample, null, 2)}
4. add-circuit-exercise
${JSON.stringify(addCircuitExerciseExample, null, 2)}
5. update-circuit-exercise
${JSON.stringify(updateCircuitExerciseExample, null, 2)}
6. remove-circuit-exercise
${JSON.stringify(removeCircuitExerciseExample, null, 2)}

When specifying changes, the workoutIndex refers to which workout the change is being applied to.
For changes applied to an 'exercise' block, the blockIndex refers to which block in the workout
the change is being applied to. 
For the update-block change, the blockIndex refers to which block in the workout the change is being applied to.
For the add-block change, the blockIndex refers to the index of the new block.
For the remove-block change, the blockIndex refers to which block in the workout to remove.
For changes applied to a 'circuit' block, the circuitBlockIndex refers to which block in the 
workout the change is being applied to. The exerciseIndex refers to which exercise in the circuit block the change is being applied to.

For the add-circuit-exercise change, the circuitBlockIndex refers to the index of the circuit block to add an exercise to. 
The exerciseIndex refers to the index of the exercise to add.

For the update-circuit-exercise change, the circuitBlockIndex refers to the index of the circuit block to update the exercise in.
The exerciseIndex refers to the index of the exercise to update.

For the remove-circuit-exercise change, the circuitBlockIndex refers to the index of the circuit block to remove an exercise from.
The exerciseIndex refers to the index of the exercise to remove.

Each exercise comes with a metadata object. The metadata object has the following fields:
- sets: the number of sets to perform
- reps: the number of reps to perform
- weight: the weight to use
- rest: the rest period between sets
- notes: any additional notes about the exercise. This can be an empty string.

Metadata fields are strings that follow specific formats:
12, 10, 8 (comma-separated)
12-15, 10-12, 8-10 (comma-separated ranges)
E/S, E, or ES (each side)
BW, BW+10, BW+20 (bodyweight + added weight)
30s, 1m, 2m30s (rest periods in seconds, minutes, or minutes and seconds)
`

export const buildWorkoutContext = (workouts: Workout[]): string => {
  return workouts
    .map(
      (workout, i) => `Workout ${i + 1}: ${workout.name} 
${workout.blocks
  .map((block) => {
    if (block.type === "exercise") {
      const { exercise } = block
      return `- ${exercise.name} 
  Sets: ${exercise.metadata.sets}
  Reps: ${exercise.metadata.reps}
  Weight: ${exercise.metadata.weight}
  Rest: ${exercise.metadata.rest}
  ${exercise.metadata.notes ? `Notes: ${exercise.metadata.notes}` : ""}`
    }
    const { circuit } = block
    return `- Circuit: ${circuit.name}
  Sets: ${circuit.metadata.sets}
  Rest: ${circuit.metadata.rest}
  Exercises:
  ${circuit.exercises
    .map(
      (ex: ExerciseBlock) => `  - ${ex.exercise.name} 
    Sets: ${ex.exercise.metadata.sets}
    Reps: ${ex.exercise.metadata.reps}
    Weight: ${ex.exercise.metadata.weight}
    Rest: ${ex.exercise.metadata.rest}
    ${ex.exercise.metadata.notes ? `Notes: ${ex.exercise.metadata.notes}` : ""}`
    )
    .join("\n  ")}`
  })
  .join("\n")}`
    )
    .join("\n")
}

function buildContextItem(item: ContextItem) {
  switch (item.type) {
    case "client":
      return buildClientContext(item.data)
    case "exercises":
      return buildExercisesContext(item.data)
    default:
      return ""
  }
}

function buildClientContext(client: ClientContextData) {
  const clientData = client
  return `
${createSection(
  currentClientContextSectionName,
  `
- Name: ${clientData.firstName}
- Age: ${clientData.age ?? "Not specified"}
- Weight: ${clientData.weightKg ? `${clientData.weightKg} kg` : "Not specified"}
- Height: ${clientData.heightCm ? `${clientData.heightCm} cm` : "Not specified"}
- Lifting Experience: ${clientData.liftingExperienceMonths ? `${clientData.liftingExperienceMonths} months` : "Not specified"}
- Gender: ${clientData.gender ?? "Not specified"}

${clientData.details?.map((d) => `- ${d.title}: ${d.description}`).join("\n") ?? "No additional details provided"}
`
)}`
}

function buildExercisesContext(
  exercises: ExercisesContextData,
  { includeIDs }: { includeIDs: boolean } = { includeIDs: false }
) {
  const exerciseNames = exercises.exercises.map((e) =>
    includeIDs ? `${e.name} (id: ${e.id})` : e.name
  )
  return createSection(preferredExercisesSectionName, exerciseNames.join("\n"))
}

/**
 * Builds the system prompt by combining the base `systemPrompt` with any client or exercise context.
 *
 * The contextItems must match the shape defined by `ContextItem`. If no context is provided
 * the base prompt is returned with a note indicating that general fitness advice can be given.
 */
function buildSystemPrompt(
  contextItems: ContextItem[] = [],
  workouts?: Workouts
): string {
  const contextSections: string[] = contextItems.map(buildContextItem)
  if (workouts && workouts.length > 0) {
    contextSections.push(
      createSection(currentWorkoutsSectionName, buildWorkoutContext(workouts))
    )
  }

  if (contextItems.length === 0) {
    return systemPrompt
  }

  return `${systemPrompt}\n${contextSections.join("\n")}`
}

/**
 * Builds a specialized system prompt to create a structured workout in JSON.
 */
function buildWorkoutCreationPrompt(
  contextItems: ContextItem[] = [],
  workouts?: Workouts
): string {
  const contextSections = contextItems
    .filter((i) => i.type === "exercises")
    .map((i) => buildExercisesContext(i.data, { includeIDs: true }))

  const workoutsSection = workouts
    ? createSection(
        currentWorkoutsSectionName,
        JSON.stringify(workouts, null, 2)
      )
    : ""
  return `${createWorkoutToolPrompt}\n${contextSections.join("\n")}\n${workoutsSection}`
}

/**
 * Builds a specialized system prompt for workout modification mode (text-based output)
 */
function buildWorkoutModificationPrompt(
  contextItems: ContextItem[] = [],
  workouts?: Workouts
): string {
  const contextSections = contextItems
    .filter((i) => i.type === "exercises")
    .map((i) => buildExercisesContext(i.data, { includeIDs: true }))

  const workoutsSection = workouts
    ? createSection(
        currentWorkoutsSectionName,
        JSON.stringify(workouts, null, 2)
      )
    : ""
  return `${updateWorkoutToolPrompt}\n${contextSections.join("\n")}\n${workoutsSection}`
}

/**
 * Builds a system prompt for converting text-based workout changes to structured diffs
 */
function buildDiffGenerationPrompt(
  workouts: Workouts,
  updatedWorkoutText: string
): string {
  return `
You are given an original workout program in json and text format, and an updated workout program in text format.

<ORIGINAL_WORKOUT_JSON>
${JSON.stringify(workouts, null, 2)}
</ORIGINAL_WORKOUT_JSON>

<UPDATED_WORKOUT_TEXT>
${updatedWorkoutText}
</UPDATED_WORKOUT_TEXT>

Return a json array of changes that were made to the original workout program. Make sure that the json adheres to the schema provided.

There are 6 different types of changes that can be made to the workout program:
- update-block
- add-block
- remove-block
- add-circuit-exercise
- remove-circuit-exercise
- update-circuit-exercise

Here is an example of the different types of changes that can be made to the workout program:

{
  "type": "update-block",
  "workoutIndex": 0,
  "blockIndex": 0,
  "block": ... // The updated block
}

{
  "type": "add-block",
  "workoutIndex": 0,
  "afterBlockIndex": 0,
  "block": ... // The block to add
}

{
  "type": "remove-block",
  "workoutIndex": 0,
  "blockIndex": 0
}

{
  "type": "add-circuit-exercise",
  "workoutIndex": 0,
  "circuitBlockIndex": 0,
  "afterExerciseIndex": 0,
  "exercise": ... // The exercise to add
}

{
  "type": "remove-circuit-exercise",
  "workoutIndex": 0,
  "circuitBlockIndex": 0,
  "exerciseIndex": 0
}

{
  "type": "update-circuit-exercise",
  "workoutIndex": 0,
  "circuitBlockIndex": 0,
  "exerciseIndex": 0,
  "exercise": ... // The updated exercise
}
`
}

export {
  buildSystemPrompt,
  buildWorkoutModificationPrompt,
  buildWorkoutCreationPrompt,
  buildDiffGenerationPrompt,
}
