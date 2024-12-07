import { LoginForm } from '@/components/login-form'
import { serverRedirectToHomeIfAuthorized } from '@/lib/supabase/server/auth-utils'

export default async function Page() {
  await serverRedirectToHomeIfAuthorized()
  return (
    <div className="flex h-screen w-full items-center justify-center px-4">
      <LoginForm />
    </div>
  )
}
