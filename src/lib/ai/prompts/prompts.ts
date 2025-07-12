import type { Workout, Workouts } from "@/lib/domain/workouts"
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
for help. You avoid providing general fitness advice. Instead, you focus on providing specific
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
`

export const updateWorkoutToolPrompt = `
`

export function buildWorkoutContext(workouts: Workout[]): string {
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
      (ex: any) => `  - ${ex.exercise.name} 
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

function buildExercisesContext(exercises: ExercisesContextData) {
  return createSection(
    preferredExercisesSectionName,
    exercises.exercises.map((e) => e.name).join("\n")
  )
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
 * Builds a specialized system prompt for workout modification mode (text-based output)
 */
function buildWorkoutModificationPrompt(
  contextItems: ContextItem[] = [],
  workouts?: Workouts
): string {
  const basePrompt = buildSystemPrompt(contextItems, workouts)

  return `${basePrompt}

## WORKOUT MODIFICATION MODE

You are now operating in specialized workout modification mode. Your task is to modify the current workout program based on the user's request and output the complete updated program in text format.

### Exercise Selection Rules
- Choose exercises ONLY from the provided exercise database - do not generate or hallucinate exercises
- ALWAYS use the exact exercise ID from the provided exercise context when selecting exercises
- "Dynamic warm-ups" or generic exercise names are not allowed - use specific exercise names
- Consider biomechanical factors such as joint limitations, mobility, and movement patterns when making substitutions
- Ensure exercise variety and progression over time while keeping the program aligned with the client's capabilities
- When adding new exercises, they MUST be selected from the <TRAINER_PREFERRED_EXERCISES> section with their exact IDs

### Training Variables Requirements
Each exercise must include specific values for:
- **Sets**: Use formats like "12, 10, 8" (comma-separated), "8-12" (ranges), or "12-15, 10-12, 8-10" (range combinations)
- **Reps**: Same formatting as sets, include "E/S", "E", or "ES" for unilateral exercises (each side)
- **Weight**: Use specific values in lbs (135, 45, 0.5), "B/W" or "BW" for bodyweight, "BW+10" for added weight
- **Rest**: Use "30s" (seconds), "1m" (minutes), "2m30s" (minutes and seconds)
- **Notes**: Optional but helpful for form cues or modifications

### Program Structure Integrity
- Maintain the requested number of training days per week
- Respect existing workout structure (exercise blocks vs circuit blocks)
- Ensure logical exercise ordering and muscle group balance
- Consider training volume and recovery between sessions

### Output Format Requirements
Provide your response in exactly this structure:

1. **Brief Explanation**: Start with 2-3 sentences explaining what changes you made and why
2. **Complete Updated Workout**: Output the entire modified program in the same text format as the original

Maintain the exact same text structure but with your modifications applied:
- Keep workout names and IDs unchanged unless explicitly requested
- Keep exercise IDs unchanged unless substituting exercises
- Update sets, reps, weight, rest, and notes as needed
- For new exercises, use the exact exercise ID from the <TRAINER_PREFERRED_EXERCISES> section
- NEVER use placeholder IDs like "NEW_EXERCISE_ID" - always use real exercise IDs from the context

### Safety Guidelines
- Always validate that new exercises exist in the provided exercise database
- Maintain appropriate progression and volume for the client's experience level
- Consider equipment availability when making substitutions
- Ensure rest periods are appropriate for the training goals
- Factor in any client limitations or contraindications mentioned in their details

### Exercise ID Validation
- Before using any exercise, verify it exists in the <TRAINER_PREFERRED_EXERCISES> section
- Exercise IDs must be exact UUID matches from the provided exercise list
- If an exercise is not in the provided list, do not use it - suggest the closest available alternative
- When outputting exercise information, always include both the exercise name AND its exact ID

Analyze the current program, make the requested modifications while maintaining program integrity, and provide the complete updated workout program.`
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
  buildDiffGenerationPrompt,
}
