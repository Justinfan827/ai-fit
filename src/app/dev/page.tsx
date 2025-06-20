import { createServerClient } from '@/lib/supabase/create-server-client'

type DebugLog = {
  id: number
  created_at: string
  request_data: any
  response_data: any
}

export default async function DevPage() {
  if (process.env.NODE_ENV !== 'development') {
  }
  const sb = await createServerClient()
  const { data, error } = await sb
    .from('debug_log')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return <div>Error: {error.message}</div>
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">Dev</h1>
      <p className="text-muted-foreground text-sm">
        This is a dev page. It is not meant for production use.
      </p>

      <h2 className="text-xl font-bold">Debug Log</h2>
      {data.map((log) => (
        <LogItem key={log.id} log={log} />
      ))}
    </div>
  )
}

function LogItem({ log }: { log: DebugLog }) {
  return (
    <div className="flex w-full flex-col gap-2 rounded-md border p-4">
      <p className="text-muted-foreground text-sm">
        {new Date(log.created_at).toLocaleString()}
      </p>
      <JsonPreview title="Request Data" data={log.request_data} />
      <JsonPreview title="Response Data" data={log.response_data} />
    </div>
  )
}

function JsonPreview({ title, data }: { title: string; data: any }) {
  const jsonString = JSON.stringify(data, null, 2) || '{}'

  return (
    <div className="relative rounded-md bg-slate-950 p-4">
      <p className="mb-2 text-sm font-bold text-white">{title}</p>
      <pre className="break-all whitespace-pre-wrap">
        <code className="text-white">{jsonString}</code>
      </pre>
    </div>
  )
}
