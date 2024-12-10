import {
  Workout,
  WorkoutInstance,
  workoutInstanceSchema,
} from '@/lib/domain/workouts'
import { APIResponse } from '@/lib/types/apires'
import { getError } from '@/lib/utils/util'

export default async function apiCreateWorkoutInstance({
  body,
}: {
  body: Workout
}): Promise<APIResponse<WorkoutInstance>> {
  try {
    const res = await fetch(`/api/workout/instance`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    if (!res.ok) {
      const bodyMsg = await res.text()
      return {
        data: null,
        error: new Error(bodyMsg || res.statusText),
      }
    }

    const { data: apiData } = await res.json()
    const { data, error } = workoutInstanceSchema.safeParse(apiData)
    if (error) {
      return {
        data: null,
        error: new Error(error.message),
      }
    }
    return {
      data,
      error: null,
    }
  } catch (e) {
    return {
      error: getError(e),
      data: null,
    }
  }
}

// generic async fetcher
