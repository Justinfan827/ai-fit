import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
  component: TestPage,
})

function TestPage() {
  return (
    <div className="flex h-screen items-center justify-center">
      <h1 className="font-bold text-4xl">TanStack Start Works!</h1>
    </div>
  )
}
