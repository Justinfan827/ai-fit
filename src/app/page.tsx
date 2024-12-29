import { serverRedirectToHomeIfAuthorized } from '@/lib/supabase/server/auth-utils'
import { redirect } from 'next/navigation'

export default async function Page() {
  await serverRedirectToHomeIfAuthorized()
  redirect('/login')
}
