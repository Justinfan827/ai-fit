import { User } from '@supabase/supabase-js'
const USER_ROLE_KEY = 'USER_ROLE'
const CLIENT_KEY_VALUE = 'CLIENT'

// https://github.com/supabase-community/supabase-custom-claims
export function isClient(user: User | null) {
  return user?.app_metadata?.[USER_ROLE_KEY] === CLIENT_KEY_VALUE
}
