import { serverRedirectToHomeIfAuthorized } from '@/lib/supabase/server/auth-utils'

export default async function Page() {
  await serverRedirectToHomeIfAuthorized()
}
