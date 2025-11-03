import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { UnauthHeader } from "@/components/header"
import { LoginForm } from "@/components/login-form"

export default async function Page() {
  const { userId } = await auth()
  if (userId) {
    redirect("/home/clients")
  }

  return (
    <div className="h-dvh">
      <UnauthHeader />
      <div className="my-auto flex h-[calc(100dvh-8rem)] items-center justify-center space-y-8">
        <LoginForm />
      </div>
    </div>
  )
}
