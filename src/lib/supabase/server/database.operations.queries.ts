import 'server-only'

import { Res } from '@/lib/types/types'
import { User } from '@supabase/supabase-js'
import { DBClient } from '../types'

export async function getUserFirstLast(client: DBClient, user: User) {
  return client
    .from('users')
    .select('first_name, last_name')
    .eq('id', user.id)
    .single()
}

export async function getCurrentUser(client: DBClient): Promise<Res<User>> {
  const { data: userRes, error: getUserError } = await client.auth.getUser()
  if (getUserError) {
    return { data: null, error: getUserError }
  }
  const { user } = userRes
  return { data: user, error: null }
}
