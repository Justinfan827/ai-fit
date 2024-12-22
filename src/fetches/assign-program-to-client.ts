import { APIResponse } from '@/lib/types/apires'
import { getError } from '@/lib/utils/util'

export default async function apiAssignProgramToClient({
  clientId,
  programId,
}: {
  clientId: string
  programId: string
}): Promise<APIResponse<undefined>> {
  try {
    const res = await fetch(`/api/client/programs/assign`, {
      method: 'POST',
      body: JSON.stringify({
        clientId,
        programId,
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
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

// generic async fetcher
