import { programSchema } from '@/lib/domain/workouts'
import {
  createProgram,
  updateProgram,
} from '@/lib/supabase/server/database.operations.mutations'
import { NextRequest, NextResponse } from 'next/server'
import { authUserRequest } from '../auth'
import {
  BadRequestError,
  BadRequestRes,
  InternalError,
  InternalErrorRes,
  UnauthorizedRes,
} from '../errors'

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
  const { data: bData, error: bError } = programSchema.safeParse(body)
  if (bError) {
    return BadRequestRes(
      new BadRequestError(
        `Invalid request body: ${bError.name} ${bError.message}`
      )
    )
  }
  const resp = await createProgram(data.user.id, bData)
  if (resp.error) {
    return InternalErrorRes(
      new InternalError('Failed to create program', { cause: resp.error })
    )
  }
  return NextResponse.json(resp)
}

export async function PUT(request: NextRequest) {
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
  const { data: bData, error: bError } = programSchema.safeParse(body)
  console.log({bError});
  if (bError) {
    return BadRequestRes(
      new BadRequestError(
        `Invalid request body: ${bError.name} ${bError.message}`
      )
    )
  }
  const resp = await updateProgram(data.user.id, bData)
  console.log({resp});
  return NextResponse.json(resp)
}
