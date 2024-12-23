import { UnauthHeader } from '@/components/header'
import { LoginForm } from '@/components/login-form'
import { serverRedirectToHomeIfAuthorized } from '@/lib/supabase/server/auth-utils'

export default async function Page() {
  await serverRedirectToHomeIfAuthorized()
  return (
    <div className="h-dvh">
      <UnauthHeader />
      <div className="my-auto flex h-[calc(100dvh-8rem)] items-center justify-center space-y-8">
        <LoginForm />
      </div>
    </div>
  )
}
