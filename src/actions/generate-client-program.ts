'use server'

import { Exercise, exercisesSchema } from '@/lib/domain/workouts'
import { GenerateProgramSchema } from '@/lib/domain/workouts_ai_response'
import { z } from 'zod'
import { withActionAuthSchema } from './middleware/withAuth'
import openaiGenerate from './openai-generation'

// This schema is used to validate input from client.
const schema = z.object({
  entities: z.object({
    clientId: z.string().uuid(),
    trainerId: z.string().uuid(),
  }),
  body: z.object({
    lengthOfWorkout: z.number(),
    // lengthOfProgram: z.number(),
    daysPerWeek: z.number(),
    preferredExercises: exercisesSchema,
    otherNotes: z.string(),
  }),
})

const parameterString = (params: z.infer<typeof schema>['body']) => {
  const sanitizedExercises = params.preferredExercises.map((exercise) => ({
    // truncate to first 5 characters to save context window space
    // id: exercise.id,
    id: exercise.id.slice(0, 5),
    name: exercise.name,
    muscleGroup: exercise.muscleGroup,
  }))
  return `length of workouts: ${params.lengthOfWorkout}, workouts per week: ${params.daysPerWeek}, coaches notes: ${params.otherNotes}, exercises to choose from: ${JSON.stringify(sanitizedExercises)}, `
}

/*
 * ValidateProgram
 *   This function validates the generated program by checking if all exercises
 *   in the program are present in the preferred exercises list.
 *   It also replaces the exercise IDs in the program with the full IDs
 *   from the preferred exercises list.
 */
function validateProgram({
  program,
  preferredExercises,
}: {
  program: GenerateProgramSchema
  preferredExercises: Exercise[]
  daysPerWeek: number
}) {
  if (!program.workouts) {
    return {
      data: null,
      error: new Error('No workouts included in generated program'),
    }
  }

  for (let i = 0; i < program.workouts.length; i++) {
    const workout = program.workouts[i]
    if (!workout.blocks) {
      return {
        data: null,
        error: new Error(`Workout ${i + 1} has no blocks`),
      }
    }

    for (let j = 0; j < workout.blocks.length; j++) {
      const block = workout.blocks[j]
      if (block.type === 'exercise') {
        const exercise = preferredExercises.find(
          (e) => e.id.slice(0, 5) === block.exercise.id
        )
        if (!exercise) {
          return {
            data: null,
            error: new Error(
              `Exercise ${block.exercise.name} not found. Invalid ID: ${block.exercise.id}`
            ),
          }
        }
        block.exercise.id = exercise.id // replace with full id
        program.workouts[i].blocks[j] = block
      } else if (block.type === 'circuit') {
        const circuitExercises = block.circuit.exercises
        for (let k = 0; k < circuitExercises.length; k++) {
          const exercise = circuitExercises[k].exercise
          const foundExercise = preferredExercises.find(
            (e) => e.id.slice(0, 5) === exercise.id
          )
          if (!foundExercise) {
            return {
              data: null,
              error: new Error(
                `Exercise ${exercise.name} not found. Invalid ID: ${exercise.id}`
              ),
            }
          }
          exercise.id = foundExercise.id // replace with full id
          circuitExercises[k].exercise = exercise
        }
        block.circuit.exercises = circuitExercises
        program.workouts[i].blocks[j] = block
      }
    }
  }
  return {
    data: program,
    error: null,
  }
}

export const generateClientProgramAction = withActionAuthSchema(
  {
    schema,
  },
  async ({ data }): Promise<GenerateProgramSchema> => {
    // look at how to do this:
    // https://sdk.vercel.ai/cookbook/rsc/generate-object
    const prompt = `Generate workout program in JSON format for this client with the following parameters: ${parameterString(data.body)}`
    const { data: aiGeneratedProgram, error } = await openaiGenerate({
      context: [
        {
          role: 'assistant',
          content: prompt,
        },
      ],
    })

    if (error) {
      throw error
    }

    // TODO: validate ai generated exercises are in the input exercise list
    // + verify format of sets/reps/weight/rest?
    const { data: validationData, error: validationErr } = validateProgram({
      program: aiGeneratedProgram,
      preferredExercises: data.body.preferredExercises,
      daysPerWeek: data.body.daysPerWeek,
    })

    if (validationErr) {
      throw validationErr
    }
    return validationData
  }
)
