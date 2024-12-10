import { workoutSchema } from '@/lib/domain/workouts'
import { createWorkoutInstance } from '@/lib/supabase/server/database.operations.mutations'
import { NextRequest, NextResponse } from 'next/server'
import { authUserRequest } from '../../auth'
import { BadRequestError, BadRequestRes, UnauthorizedRes } from '../../errors'

export async function POST(request: NextRequest) {
  const { data, error } = await authUserRequest()
  if (error) {
    return UnauthorizedRes(error)
  }
  const body = await request.json()
  if (!body) {
    return BadRequestRes(
      new BadRequestError('Request body is required for this endpoint')
    )
  }
  const { data: bData, error: bError } = workoutSchema.safeParse(body)
  if (bError) {
    return BadRequestRes(
      new BadRequestError(
        `Invalid request body: ${bError.name} ${bError.message}`
      )
    )
  }
  const resp = await createWorkoutInstance(data.user.id, bData)
  return NextResponse.json(resp)
}