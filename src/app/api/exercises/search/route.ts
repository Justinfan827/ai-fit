import 'server-only'

import { Exercise, exercisesSchema } from '@/lib/domain/workouts'
import { createServerClient } from '@/lib/supabase/create-server-client'
import { APIResponse } from '@/lib/types/apires'
import { NextRequest, NextResponse } from 'next/server'
import { InternalError } from '../../errors'

export async function GET(request: NextRequest) {
  // query params
  const query = request.nextUrl.searchParams.get('query')
  if (!query) {
    return NextResponse.json({ data: [] })
  }
  const resp = await searchExercises({ query: query })
  return NextResponse.json(resp)
}

async function searchExercises({
  query,
}: {
  query: string
}): Promise<APIResponse<Exercise[]>> {
  const sb = await createServerClient()
  const { data, error } = await sb.rpc('search_exercises_by_name', {
    exercise_name: query,
    threshold: 0.23,
  })

  if (error) {
    return {
      data: null,
      error: new InternalError(`Error searching exercises; ${error.message}`),
    }
  }

  const exercises = data.map((item) => {
    return {
      id: item.id,
      name: item.name,
    }
  })

  const { data: exercisesValidated, error: validationErr } =
    exercisesSchema.safeParse(exercises)
  if (validationErr) {
    return {
      data: null,
      error: new InternalError(`Error validating exercises; ${validationErr}`),
    }
  }

  console.log({ exercisesValidated })
  return {
    data: exercisesValidated,
    error: null,
  }
}
