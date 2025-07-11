import { checkServerUserAuth } from "@/lib/supabase/server/auth-utils"

export async function authUserRequest() {
  const { user, error: authError } = await checkServerUserAuth()
  if (authError) {
    throw authError
  }
  return user
}
