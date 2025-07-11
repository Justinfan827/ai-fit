import { type Program, programSchema } from "@/lib/domain/workouts"
import type { APIResponse } from "@/lib/types/apires"
import { getError } from "@/lib/utils/util"

export default async function apiCreateProgram({
  body,
}: {
  body: Program
}): Promise<APIResponse<Program>> {
  try {
    const res = await fetch("/api/program", {
      method: "POST",
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

    const { data: apiData } = await res.json()
    const { data, error } = programSchema.safeParse(apiData)
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
