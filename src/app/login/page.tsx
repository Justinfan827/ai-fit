import { UnauthHeader } from "@/components/header"
import { LoginForm } from "@/components/login-form"
import { redirectAuthorizedUser } from "@/lib/supabase/server/auth-utils"

export default async function Page() {
  await redirectAuthorizedUser()
  return (
    <div className="h-dvh">
      <UnauthHeader />
      <div className="my-auto flex h-[calc(100dvh-8rem)] items-center justify-center space-y-8">
        <LoginForm />
      </div>
    </div>
  )
}
