import {
  getAllChatsWithMetadata,
  getAllSystemPrompts,
} from "@/lib/supabase/server/debug-queries"

export default async function DebugPage() {
  const [chats, prompts] = await Promise.all([
    getAllChatsWithMetadata(),
    getAllSystemPrompts(),
  ])

  return (
    <div className="container mx-auto space-y-8 p-6">
      <h1 className="mb-4 font-bold text-2xl">Debug Dashboard</h1>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <h2 className="mb-4 font-semibold text-xl">Chats ({chats.length})</h2>
          <div className="space-y-2">
            {chats.map((chat) => (
              <div className="rounded border p-2" key={chat.id}>
                <a
                  className="font-mono text-blue-600 text-sm hover:underline"
                  href={`/admin/debug/chat/${chat.id}`}
                >
                  {chat.id}
                </a>
                <span className="ml-2 text-gray-500 text-sm">
                  ({chat.message_count} messages)
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-4 font-semibold text-xl">
            System Prompts ({prompts.length})
          </h2>
          <div className="space-y-2">
            {prompts.map((prompt) => (
              <div className="rounded border p-2" key={prompt.id}>
                <a
                  className="font-mono text-blue-600 text-sm hover:underline"
                  href={`/admin/debug/prompt/${prompt.id}`}
                >
                  {prompt.id}
                </a>
                <div className="mt-1 text-gray-500 text-xs">
                  {prompt.created_at} ({prompt.content.length} chars)
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
