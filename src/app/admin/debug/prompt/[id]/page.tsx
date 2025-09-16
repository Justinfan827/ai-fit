import { notFound } from "next/navigation"
import { getSystemPrompt } from "@/lib/supabase/server/debug-queries"

export default async function PromptDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const prompt = await getSystemPrompt(params.id)

  if (!prompt) {
    notFound()
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-4">
        <a className="text-blue-600 hover:underline" href="/admin/debug">
          ← Back to Debug Dashboard
        </a>
      </div>

      <h1 className="mb-4 font-bold text-xl">Prompt: {params.id}</h1>

      <pre className="overflow-auto rounded bg-gray-100 p-4 text-sm">
        {JSON.stringify(prompt, null, 2)}
      </pre>
    </div>
  )
}
