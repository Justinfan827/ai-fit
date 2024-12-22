import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { authUserRequest } from '@/app/api/auth'
import {
  BadRequestError,
  BadRequestRes,
  InternalError,
  InternalErrorRes,
  UnauthorizedRes,
} from '@/app/api/errors'
import { assignProgramToUser } from '@/lib/supabase/server/database.operations.mutations'

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
  const { data: bData, error: bError } = z
    .object({
      clientId: z.string(),
      programId: z.string(),
    })
    .safeParse(body)
  if (bError) {
    return BadRequestRes(
      new BadRequestError(
        `Invalid request body: ${bError.name} ${bError.message}`
      )
    )
  }
  const { error: assignErr } = await assignProgramToUser({
    trainerId: data.user.id,
    clientId: bData.clientId,
    programId: bData.programId,
  })

  if (assignErr) {
    return InternalErrorRes(
      new InternalError(` ${assignErr.name}: ${assignErr.message}`)
    )
  }
  return NextResponse.json({
    data: undefined,
    error: null,
  })
}
