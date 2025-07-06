import { AIProgram, aiProgramSchema } from '@/lib/domain/workouts'
import { APIResponse } from '@/lib/types/apires'
import { getError } from '@/lib/utils/util'

export default async function apiGenerateProgram(body: {
  clientInfo: string
  totalNumDays: number
}): Promise<APIResponse<AIProgram>> {
  try {
    const res = await fetch(`/api/ai/generate-program`, {
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
    const { data, error } = aiProgramSchema.safeParse(apiData)
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
