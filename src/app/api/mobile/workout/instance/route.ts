import { workoutInstanceBlockSchema } from '@/lib/domain/workouts'
import { saveWorkoutInstance } from '@/lib/supabase/server/database.operations.mutations'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  BadRequestError,
  BadRequestRes,
  InternalError,
  InternalErrorRes,
} from '../../../errors'

export async function POST(req: NextRequest) {
  const client = createClient(
    // this is http://kong:8000 on localhost. Interesting.
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  )
  const body = await req.json()
  // Get the session or user object
  const authHeader = req.headers.get('Authorization') || ''
  const token = authHeader.replace('Bearer ', '')
  const { data: userdata, error } = await client.auth.getUser(token)
  if (!userdata) {
    return BadRequestRes(
      new BadRequestError('Request body is required for this endpoint')
    )
  }
  if (error) {
    return InternalErrorRes(
      new InternalError('Failed to get user data', { cause: error })
    )
  }
  const { data: bData, error: bError } = z
    .object({
      id: z.string(),
      workoutId: z.string(),
      programId: z.string(),
      startAt: z.string(),
      endAt: z.string(),
      blocks: z.array(workoutInstanceBlockSchema),
    })
    .safeParse(body)
  if (bError) {
    console.log({ bError })
    return BadRequestRes(
      new BadRequestError(
        `Invalid request body: ${bError.name} ${bError.message}`
      )
    )
  }
  const { error: saveErr } = await saveWorkoutInstance({
    id: bData.id,
    startAt: bData.startAt,
    endAt: bData.endAt,
    blocks: bData.blocks,
    workoutId: bData.workoutId,
    programId: bData.programId,
    userId: userdata.user.id,
  })
  console.log({ saveErr })
  if (saveErr) {
    return InternalErrorRes(
      new InternalError('Failed to create program', { cause: saveErr })
    )
  }
  return NextResponse.json({ saved: true })
}
