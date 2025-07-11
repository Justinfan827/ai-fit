import type { WorkoutInstance } from "@/lib/domain/workouts"
import type { APIResponse } from "@/lib/types/apires"
import { getError } from "@/lib/utils/util"

export default async function apiUpdateWorkoutInstance({
  body,
}: {
  body: WorkoutInstance
}): Promise<APIResponse<undefined>> {
  try {
    const res = await fetch("/api/workout/instance", {
      method: "PUT",
      body: JSON.stringify(body),
      headers: new Headers({ "Content-Type": "application/json" }),
    })
    if (!res.ok) {
      const bodyMsg = await res.text()
      return {
        data: null,
        error: new Error(bodyMsg || res.statusText),
      }
    }
    return {
      data: undefined,
      error: null,
    }
  } catch (e) {
    return {
      error: getError(e),
      data: null,
    }
  }
}
