import { workoutInstanceSchema, workoutSchema } from '@/lib/domain/workouts'
import {
  createWorkoutInstance,
  updateWorkoutInstance,
} from '@/lib/supabase/server/database.operations.mutations'
import { NextResponse } from 'next/server'
import { withAuthBodySchema } from '../../middleware/withAuth'

export const POST = withAuthBodySchema(
  { schema: workoutSchema },
  async ({ req, user, body }) => {
    const resp = await createWorkoutInstance(user.id, body)
    return NextResponse.json(resp)
  }
)

export const PUT = withAuthBodySchema(
  { schema: workoutInstanceSchema },
  async ({ req, user, body }) => {
    const resp = await updateWorkoutInstance(body)
    return NextResponse.json(resp)
  }
)
