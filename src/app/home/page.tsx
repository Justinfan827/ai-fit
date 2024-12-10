import { getAllPrograms } from '@/lib/supabase/server/database.operations.queries'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export default async function WorkoutsPage() {
  const { data, error } = await getAllPrograms()
  if (error) {
    return <div>error: {error.message}</div>
  }
  return (
    <div className="mx-auto max-w-7xl">
      <div id="list-container" className="mt-8">
        {data.map((program, idx) => (
          <Link
            href={`/test/${program.id}`}
            key={program.id}
            className={cn(
              'flex border-x border-b border-neutral-700 px-4 py-4',
              idx === 0 && 'rounded-t-sm border-t',
              idx === data.length - 1 && 'rounded-b-sm border-b'
            )}
          >
            {program.name}
          </Link>
        ))}
      </div>
    </div>
  )
}
