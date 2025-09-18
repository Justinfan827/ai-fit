import { notFound } from "next/navigation"
import { PromptEvaluator } from "@/components/prompt-evaluator"
import { getSystemPrompt } from "@/lib/supabase/server/debug-queries"
import { PromptViewer } from "./prompt-viewer"

export default async function PromptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const id = (await params).id
  const prompt = await getSystemPrompt(id)

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

      <div className="mb-6">
        <h1 className="mb-2 font-bold text-xl">System Prompt</h1>
        <div className="text-gray-600 text-sm">
          <p>
            <strong>ID:</strong> {prompt.id}
          </p>
          <p>
            <strong>Created:</strong>{" "}
            {new Date(prompt.created_at).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <PromptViewer content={prompt.content} />
        <PromptEvaluator systemPrompt={prompt.content} />
      </div>
    </div>
  )
}
