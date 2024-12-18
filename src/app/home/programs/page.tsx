import { Typography } from '@/components/typography'
import { Button } from '@/components/ui/button'
import { getUserPrograms } from '@/lib/supabase/server/database.operations.queries'
import { cn } from '@/lib/utils'
import dayjs from 'dayjs'
import Link from 'next/link'

export default async function WorkoutsPage() {
  const { data, error } = await getUserPrograms()
  if (error) {
    return <div>error: {error.message}</div>
  }
  return (
    <div className="">
      <div className="border-b border-b-neutral-800 p-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between sm:px-6 sm:py-6 lg:px-8 lg:py-6">
          <Typography className="text-2xl tracking-wide" variant="h2">
            Programs
          </Typography>
          <div className="flex w-full justify-end">
            <Button asChild>
              <Link href="/home/programs/new">New program</Link>
            </Button>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div id="list-container" className="mt-8">
          {data.map((program, idx) => (
            <div
              key={program.id}
              className={cn(
                'flex flex-col border-x border-b border-neutral-800 px-4 py-6',
                idx === 0 && 'rounded-t-sm border-t',
                idx === data.length - 1 && 'rounded-b-sm border-b'
              )}
            >
              <Link href={`/home/programs/${program.id}`}>{program.name}</Link>
              <p className="font-mono text-xs text-muted-foreground">
                created at {dayjs(program.created_at).format('MM/DD/YY')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
