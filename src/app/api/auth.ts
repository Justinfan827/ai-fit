import { checkServerUserAuth } from '@/lib/supabase/server/auth-utils'
import { User } from '@supabase/supabase-js'
import { AuthError } from './errors'
import { APIResponse } from './types'

export interface AuthResponseData {
  user: User
}
export async function authUserRequest(): Promise<
  APIResponse<AuthResponseData>
> {
  const { user, error: authError } = await checkServerUserAuth()
  if (authError) {
    return {
      data: null,
      error: new AuthError('Error authenticating client user', {
        cause: authError,
      }),
    }
  }
  return {
    data: { user },
    error: null,
  }
}
