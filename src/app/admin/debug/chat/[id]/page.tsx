import { notFound } from "next/navigation"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getChatWithMessages } from "@/lib/supabase/server/debug-queries"

export default async function ChatDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const chat = await getChatWithMessages(params.id)

  if (!chat) {
    notFound()
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-4">
        <a className="text-blue-600 hover:underline" href="/admin/debug">
          ← Back to Debug Dashboard
        </a>
      </div>
      <h1 className="mb-4 font-bold text-xl">Chat: {params.id}</h1>
      <ScrollArea className="h-[500px] rounded bg-card p-4 text-sm">
        <pre className="overflow-auto ">{JSON.stringify(chat, null, 2)}</pre>
      </ScrollArea>
    </div>
  )
}
