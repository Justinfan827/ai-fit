import 'server-only'

import { exercisesSchema } from '@/lib/domain/workouts'
import { createServerClient } from '@/lib/supabase/create-server-client'
import { NextResponse } from 'next/server'
import { withPublic } from '../../middleware/withAuth'

export const GET = withPublic(async ({ req }) => {
  const query = req.nextUrl.searchParams.get('query')
  if (!query) {
    return NextResponse.json({ data: [] })
  }
  const sb = await createServerClient()
  const { data: exData, error } = await sb.rpc('search_exercises_by_name', {
    exercise_name: query,
    threshold: 0.23,
  })
  if (error) {
    throw error
  }
  const exercises = exData.map((item) => {
    return {
      id: item.id,
      name: item.name,
    }
  })

  const { data, error: validationErr } = exercisesSchema.safeParse(exercises)
  if (validationErr) {
    throw validationErr
  }
  return NextResponse.json({ data })
})
