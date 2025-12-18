import { createFileRoute } from "@tanstack/react-router"
import { UnauthHeader } from "@/components/header"
import { LoginForm } from "@/components/login-form"

export const Route = createFileRoute("/login")({
  component: LoginPage,
})

function LoginPage() {
  console.log("[LoginPage] LoginPage component rendered")
  return (
    <div className="h-dvh">
      <UnauthHeader />
      <div className="my-auto flex h-[calc(100dvh-8rem)] items-center justify-center space-y-8">
        <LoginForm />
      </div>
    </div>
  )
}
