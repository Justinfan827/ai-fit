'use server'

import { z } from 'zod'
import { withActionAuthSchema } from './middleware/withAuth'

const clientInfo = z.object({
  weightKg: z.number(),
  heightCm: z.number(),
  age: z.number(),
  liftingExperienceMonths: z.number(),
  gender: z.string(),
})
const programParameters = z.object({
  lengthOfWorkout: z.number(),
  daysPerWeek: z.number(),
  lengthOfProgram: z.number(),
  otherNotes: z.string(),
})
const schema = z.object({
  clientId: z.string(),
  clientInfo: clientInfo,
  programParameters: programParameters,
})

// https://platform.openai.com/docs/models/gpt-4o-mini

export const createClientProgramAction = withActionAuthSchema(
  {
    schema,
  },
  async ({ data, user }) => {
    return {
      data: 'asdf',
      error: null,
    }
  }
)
