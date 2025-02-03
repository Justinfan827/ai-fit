import { programSchema } from '@/lib/domain/workouts'
import {
  createProgram,
  updateProgram,
} from '@/lib/supabase/server/database.operations.mutations'
import { NextResponse } from 'next/server'
import { withAuthBodySchema } from '../middleware/withAuth'

// POST - Create a new program
export const POST = withAuthBodySchema(
  {
    schema: programSchema,
  },
  async ({ user, body }) => {
    const resp = await createProgram(user.id, body)
    if (resp.error) {
      throw resp.error
    }
    return NextResponse.json(resp)
  }
)

export const PUT = withAuthBodySchema(
  {
    schema: programSchema,
  },
  async ({ user, body }) => {
    const resp = await updateProgram(user.id, body)
    if (resp.error) {
      throw resp.error
    }
    return NextResponse.json(resp)
  }
)
