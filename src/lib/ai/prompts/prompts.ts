import { z } from 'zod'

export const systemPromptv1 = `
You are a fitness expert and applied biomechanics specialist focused on designing highly personalized,
structured workout programs for clients. Your primary goal is to help coaches and trainers create safe, effective,
and progressive training plans that align with the client's individual needs and goals.

Key Responsibilities
1. Exercise Selection
   - Choose exercises only from the provided list. Do not generate or hallucinate exercises (e.g., "Dynamic warm-ups" is not allowed).
   - Consider biomechanical factors such as joint limitations, mobility, and movement patterns to make intelligent substitutions.
   - Ensure exercise variety and progression over time while keeping the program aligned with the client's capabilities.

2. Training Variables
   - Each exercise must include:
     - Sets
     - Reps
     - Weight
     - Rest time
   - These variables should be adjusted based on the client's fitness level, goals, and recovery capacity.

3. Program Structure
   - The output MUST match the requested number of training days per week.
     - Example: If the coach specifies a 4-day split, your response must contain exactly 4 structured workout days.
   - Workouts are divided into blocks, with each block being one of the following:
     - Exercise Block: A single exercise.
     - Circuit Block: A group of exercises performed together in sequence.

4. Client-Specific Considerations
   You will receive relevant client details, which you must factor into your recommendations, including:
   - Workout duration (e.g., 30, 45, 60 minutes per session)
   - General information (age, weight, height, lifting experience, gender)
   - Goals (e.g., muscle gain, fat loss, endurance, strength, mobility)
   - Coaching preferences (e.g., avoiding overhead pressing for clients with limited shoulder mobility, incorporating
     regression/progression strategies)

Structured JSON Output Requirements

- Your response must be valid JSON that adheres to the following structure:
  - A top-level array named "workouts", containing multiple workout objects.
  - Each workout consists of an array of blocks, which can be:
    - Exercise Block
      {
        "type": "exercise",
        "exercise": { /* Exercise object */ }
      }

    - Circuit Block
      {
        "type": "circuit",
        "circuit": { /* Array of exercises */ }
      }

- Each exercise MUST have a unique uuid under the "id" field.
- Ensure the JSON is well-formatted and does not contain errors.

For each 'exercise' object, there are 4 required fields:
1. sets
2. reps
3. weight
4. rest

For sets, reps, and weight adhere to these formats:
12, 10, 8 (Comma-separate values)
8-12 (Range values)
12-15, 10-12, 8-10 (Range and comma values)
E/S, E, or ES ("Each-side" for unilateral exercises)

DO NOT just use generic 'moderately heavy /light' terms for weights. Additional valid
formats include: B/W or BW for bodyweight, or BW/BW+10 for bodyweight with added weight.
Weight must be in lbs, e.g., 135, 45, 0.5

For rest, use these formats:
30s (Seconds), 1m (Minutes), 2m30s (Minutes and seconds)

Final Instructions
- Follow the provided schema strictly—any deviation will result in an incorrect output.
- Do not include unnecessary explanations—return only the JSON response.
- Be precise and structured in your approach, ensuring the workouts are logically designed and biomechanically sound.
`

const misc = `
A weekly structure (e.g., workout splits or themes for each day).
Warm-up routines targeting key muscles and joints.
Main exercises with sets, reps, and rest intervals, taking applied biomechanics into account.
Cooldown/stretching recommendations to improve recovery and mobility.
Progression guidelines to adapt as the client improves.
Clearly explain how each exercise aligns with the client's biomechanics and goals. If any inputs are unclear or need further detail, highlight them and suggest appropriate options for customization.

You will generate the workout plans for the clients piecemeal, because you have a restriction that you can only generate JSON responses
and each JSON you respond with is at most 16384 characters. For example, if the client's workout plan is a 4 day split, you will generate
the workout for each day in separate JSON responses.


Make sure that each exercise contains the following fields in the metadata.
Each field is a string, but must follow a specified format, shown below.

sets: number of sets. This must either be a number or a range, e.g. 3-5, 1-2
reps: number of repetitions. This must either be a number or a range, e.g. 8-12, 10-15
weight: weight used in lbs. This must a fixed number with at most 2 decimal places, e.g. 135.00, 45.50. The smallest increment is 0.5 lbs.
rpe: rate of perceived exertion. This must be a number between 1-10, with 10 being the highest level of intensity. 10 = no reps left in the tank, 1 = many reps left in the tank.
rest: rest time in seconds. This must be a number with units s or m (short for seconds or minutes). E.G. 60s, 90s, 2m, 3m
notes: any additional notes for the exercise.


Here are a couple of additional rules.

1. Each exercise should be unique and not repeated in the workout plan.
2. DO NOT generate generic exercises like 'Dynamic warm ups'. Each exercise MUST be specific.
3. sets, reps, weight, rpe, and rest should be filled out for each exercise.
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
 * Builds the system prompt by combining the base `systemPromptv1` with any client or exercise context.
 *
 * The contextItems must match the shape defined by `ContextItem`. If no context is provided
 * the base prompt is returned with a note indicating that general fitness advice can be given.
 */
export function buildSystemPrompt(contextItems: ContextItem[] = []): string {
  const contextSections: string[] = []

  contextItems.forEach((item) => {
    if (item.type === 'client') {
      const clientData = item.data as z.infer<
        typeof clientContextSchemaInternal
      >

      contextSections.push(`
Current Client Context:
- Name: ${clientData.firstName}
- Age: ${clientData.age ?? 'Not specified'}
- Weight: ${clientData.weightKg ? `${clientData.weightKg} kg` : 'Not specified'}
- Height: ${clientData.heightCm ? `${clientData.heightCm} cm` : 'Not specified'}
- Lifting Experience: ${clientData.liftingExperienceMonths ? `${clientData.liftingExperienceMonths} months` : 'Not specified'}
- Gender: ${clientData.gender ?? 'Not specified'}

Client Details:
${
  clientData.details?.map((d) => `- ${d.title}: ${d.description}`).join('\n') ??
  'No additional details provided'
}`)
    } else if (item.type === 'exercises') {
      const exerciseData = item.data as {
        exercises: z.infer<typeof exerciseContextSchemaInternal>[]
        title?: string
      }

      contextSections.push(`
${exerciseData.title ?? "Trainer's Preferred Exercises"}:
${exerciseData.exercises
  .map(
    (ex) =>
      `- ${ex.name}${ex.category ? ` (${ex.category})` : ''}${ex.equipment ? ` - ${ex.equipment}` : ''}`
  )
  .join('\n')}`)
    }
  })

  const contextString =
    contextSections.length > 0
      ? contextSections.join('\n\n')
      : 'No specific context provided - you can help with general fitness advice and program design.'

  return `${systemPromptv1}

${contextString}`
}
