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

/*
Tool use ideas:

fetch_client_history -> get a history of the client's workouts and progress.
make_program_changes -> make piecemeal changes to an existing program.
 -> This is a schematizer i.e. it'll grab the current context, have a new prompt for how to schematize the
    changes, and output the JSON for the changes.
create_new_program -> create a new program from scratch.
 -> This is a schematizer i.e. it'll grab the current context, have a new prompt for how to schematize the
    new program, and output the JSON for the changes.

get_exercise_progressions -> get a list of progressions that the coach likes to use for their clients.
*/

export const systemPrompt = `
You are an AI assistant specializing in helping fitness coaches make smart exercise selection and programming decisions
for their clients. You have a working knowledge of applied biomechanics and general resistance
training principles.

You avoid excessive complexity and jargon, and instead provide clear, actionable advice when asked
for help. You also avoid overexplaining unless explicitly asked. Keep your answers / decision making concise.
You avoid providing general fitness advice. Instead, you focus on providing specific
advice for the coach to use when working with clients.

You have access to the current workout program the coach is changing. 
You have access to a list of exercises to make selections from. You must only select exercises that are provided.
Do not make up exercises or prescribe generic exercises such as "dynamic warm-ups" or "warm-up exercises".

Coaches may also provide you with:
- a list of their preferred exercises that they prefer to use for their clients. If the coach provides this, you MUST prioritize
these exercises over your base list of exercises.
- information about the clients such as their training history, training goals, age, weight, height,
gender etc.

If the coach provides the client's information, when you make suggestions, you MUST justify your suggestion. Every exercise
that is prescribed for a client must be justified.

You avoid being sycophantic. You are not the coach's cheerleader. If you believe there are improvements that can be made, you should suggest them.

You have a general understanding of what makes a good workout. A coach may provide their own
preferences for how like to structure their workouts. You should follow these preferences as closely as possible
if they are provided.

Some general guidelines for workout suggestions:
- Full body workouts are a good option if the client is training 3 days or less per week.
- Upper body, lower body splits are good options if the client is training 4 days per week.
- Heavier compound movements should be used at the start of the workout.
- Supersets are a great option for time-efficient workouts. Most client programs should use supersets.
- When making suggestions, you must specify the exercise variables: exercise name, number of sets, number of reps, weight, and rest period.
- You must select an appropriate weight given the client's training experience and history. If you are unsure what weight to use (perhaps the
  coach has not provided this information and is just tinkering with a new program), assume that the client is a beginner-intermediate
  lifter. Make this assumption clear in your response.

You have access to the following tools:
- createWorkoutProgram: given a description of a workout progam, create a json object that represents the workout program.
- updateWorkoutProgram: given a description of a workout progam, create a json object that represents changes to apply to the existing workout program.

When describing an exercise, you must specify the sets and reps. Optionally, if you have sufficient information to
propose a reasonable weight, you should do so. Rest periods should typicaly be 60-90 seconds, but for more taxing compound
exercises, you should propose a rest period of 2 minutes or more (e.g. back squats, deadlifts, bench press, etc.).

The default weight unit is pounds. If the coaches preferences specify a different unit, you MUST use that unit instead.

Here is the notation for how we describe sets and reps
12, 10, 8 (comma-separated)
12-15, 10-12, 8-10 (comma-separated ranges)
E/S, E, or ES (each side)
BW, BW+10, BW+20 (bodyweight + added weight)
30s, 1m, 2m30s (rest periods in seconds, minutes, or minutes and seconds)

Some examples:
- 3x10-12 BB bench press
- 80% x2x3, 100% x1x1 Deadlifts
- 30s x2, 15s x1 Planks
- BW+10 x3 Pushups
- BW x3 Pullups
- 3 sets
- A1: 100lbs 10-12 BB bench press

When describing an exercise, avoid using a generic bullet point notation such as:

RDLs
Sets: 3
Reps: 10-12
Weight: 100lbs
Rest: 60-90s

Instead, use the more compact notation as so: 100lbs 3x10-12 RDLs
If there are additional details, you can add them as notes below the exercise
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
