import { Workout, Workouts } from '@/lib/domain/workouts'
import { z } from 'zod'

export const systemPromptv1 = `
You are a fitness expert and applied biomechanics specialist who assists fitness coaches and trainers 
in working with their clients. Your role is to provide expert guidance on exercise programming, 
biomechanics, training principles, and client management.

## Core Expertise Areas

### Exercise Science & Biomechanics
- Understanding of movement patterns, joint mechanics, and muscle activation
- Knowledge of exercise progressions and regressions
- Ability to assess exercise suitability based on individual limitations and goals

### Program Design Principles
- Progressive overload and periodization concepts
- Training adaptations for different goals (strength, hypertrophy, endurance, mobility)
- Recovery and volume management strategies

### Client Assessment & Individualization
- Interpreting client data (age, experience, physical limitations, goals)
- Adjusting recommendations based on individual needs and preferences
- Considering equipment availability and training environment

### Safety & Best Practices
- Identifying contraindications and risk factors
- Recommending appropriate exercise modifications
- Emphasizing proper form and injury prevention

## Communication Style
- Provide clear, evidence-based explanations
- Use practical, actionable advice
- Consider the coach's expertise level and client context
- Be concise but thorough in your responses

## Key Principles
- Always prioritize client safety and appropriate progression
- Base recommendations on the provided client information and exercise database
- Maintain consistency with established training principles
- Support the coach's decision-making with expert insights

You have access to detailed client information, exercise databases, and current program context 
to provide personalized, informed recommendations.
`

// Types for context items
const clientContextSchemaInternal = z.object({
  id: z.string(),
  firstName: z.string(),
  age: z.number().optional(),
  weightKg: z.number().optional(),
  heightCm: z.number().optional(),
  liftingExperienceMonths: z.number().optional(),
  gender: z.string().optional(),
  details: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
      })
    )
    .optional(),
})

const exerciseContextSchemaInternal = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string().optional(),
  equipment: z.string().optional(),
  muscleGroups: z.array(z.string()).optional(),
})

const contextItemSchemaInternal = z.object({
  type: z.enum(['client', 'exercises']),
  data: z.union([
    clientContextSchemaInternal,
    z.object({
      exercises: z.array(exerciseContextSchemaInternal),
      title: z.string().optional(),
    }),
  ]),
})

export type ContextItem = z.infer<typeof contextItemSchemaInternal>

/**
 * Formats exercise context into a standardized XML-tagged section
 */
export function formatExerciseContext(contextItems: ContextItem[]): string {
  const exerciseContext = contextItems
    .filter((item) => item.type === 'exercises')
    .map((item) => {
      const exerciseData = item.data as {
        exercises: z.infer<typeof exerciseContextSchemaInternal>[]
        title?: string
      }
      return exerciseData.exercises
    })
    .flat()

  if (exerciseContext.length === 0) {
    return ''
  }

  return `
<TRAINER_PREFERRED_EXERCISES>
${exerciseContext
  .map(
    (ex) =>
      `- ${ex.name} (ID: ${ex.id})${ex.category ? ` - Category: ${ex.category}` : ''}${ex.equipment ? ` - Equipment: ${ex.equipment}` : ''}${ex.muscleGroups && ex.muscleGroups.length > 0 ? ` - Muscle Groups: ${ex.muscleGroups.join(', ')}` : ''}`
  )
  .join('\n')}
</TRAINER_PREFERRED_EXERCISES>
`
}

export function formatWorkoutsAsText(workouts: Workout[]): string {
  return workouts
    .map(
      (workout, i) => `
Workout ${i + 1}: ${workout.name} (ID: ${workout.id})
${workout.blocks
  .map((block: any) => {
    if (block.type === 'exercise') {
      const { exercise } = block
      return `- ${exercise.name} (ID: ${exercise.id})
  Sets: ${exercise.metadata.sets}
  Reps: ${exercise.metadata.reps}
  Weight: ${exercise.metadata.weight}
  Rest: ${exercise.metadata.rest}
  ${exercise.metadata.notes ? `Notes: ${exercise.metadata.notes}` : ''}`
    } else {
      const { circuit } = block
      return `- Circuit: ${circuit.name}
  Sets: ${circuit.metadata.sets}
  Rest: ${circuit.metadata.rest}
  Exercises:
  ${circuit.exercises
    .map(
      (ex: any) => `  - ${ex.exercise.name} (ID: ${ex.exercise.id})
    Sets: ${ex.exercise.metadata.sets}
    Reps: ${ex.exercise.metadata.reps}
    Weight: ${ex.exercise.metadata.weight}
    Rest: ${ex.exercise.metadata.rest}
    ${ex.exercise.metadata.notes ? `Notes: ${ex.exercise.metadata.notes}` : ''}`
    )
    .join('\n  ')}`
    }
  })
  .join('\n')}`
    )
    .join('\n')
}
/**
 * Builds the system prompt by combining the base `systemPromptv1` with any client or exercise context.
 *
 * The contextItems must match the shape defined by `ContextItem`. If no context is provided
 * the base prompt is returned with a note indicating that general fitness advice can be given.
 */
export function buildSystemPrompt(
  contextItems: ContextItem[] = [],
  workouts?: Workouts
): string {
  const contextSections: string[] = []

  contextItems.forEach((item) => {
    if (item.type === 'client') {
      const clientData = item.data as z.infer<
        typeof clientContextSchemaInternal
      >

      contextSections.push(`
<CURRENT_CLIENT_CONTEXT>
- Name: ${clientData.firstName}
- Age: ${clientData.age ?? 'Not specified'}
- Weight: ${clientData.weightKg ? `${clientData.weightKg} kg` : 'Not specified'}
- Height: ${clientData.heightCm ? `${clientData.heightCm} cm` : 'Not specified'}
- Lifting Experience: ${clientData.liftingExperienceMonths ? `${clientData.liftingExperienceMonths} months` : 'Not specified'}
- Gender: ${clientData.gender ?? 'Not specified'}

Client Details:
${clientData.details?.map((d) => `- ${d.title}: ${d.description}`).join('\n') ?? 'No additional details provided'}
</CURRENT_CLIENT_CONTEXT>`)
    } else if (item.type === 'exercises') {
      // Use the shared utility function for exercise context formatting
      const exerciseContext = formatExerciseContext([item])
      if (exerciseContext) {
        contextSections.push(exerciseContext.trim())
      }
    }
  })

  // Add current workouts context if provided
  if (workouts && workouts.length > 0) {
    contextSections.push(`
<CURRENT_PROGRAM_WORKOUTS>
${formatWorkoutsAsText(workouts)}
</CURRENT_PROGRAM_WORKOUTS>`)
  }

  const contextString =
    contextSections.length > 0
      ? contextSections.join('\n\n')
      : 'No specific context provided - you can help with general fitness advice and program design.'

  return `${systemPromptv1}

${contextString}`
}

/**
 * Builds a specialized system prompt for workout modification mode (text-based output)
 */
export function buildWorkoutModificationPrompt(
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
export function buildDiffGenerationPrompt(
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
- replace-block
- add-block
- remove-block
- add-circuit-exercise
- remove-circuit-exercise
- replace-circuit-exercise

Here is an example of the different types of changes that can be made to the workout program:

{
  "type": "replace-block",
  "workoutIndex": 0,
  "blockIndex": 0,
  "block": ... // The block to replace with
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
  "type": "replace-circuit-exercise",
  "workoutIndex": 0,
  "circuitBlockIndex": 0,
  "exerciseIndex": 0,
  "exercise": ... // The exercise to replace with
}
`
}
