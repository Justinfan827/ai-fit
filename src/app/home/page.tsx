import { Logo } from '@/components/icons'
import { Typography } from '@/components/typography'
import { Button } from '@/components/ui/button'
import { getAllPrograms } from '@/lib/supabase/server/database.operations.queries'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export default async function WorkoutsPage() {
  const { data, error } = await getAllPrograms()
  if (error) {
    return <div>error: {error.message}</div>
  }

  if (!data || data.length === 0) {
    return (
      <div className="mx-auto max-w-7xl sm:px-6 sm:py-6 lg:px-8 lg:py-6">
        <div className="flex w-full justify-center">
          <EmptyStateCard />
        </div>
      </div>
    )
  }
  return (
    <div className="mx-auto max-w-7xl sm:px-6 sm:py-6 lg:px-8 lg:py-6">
      <Typography className="text-2xl tracking-wide" variant="h2">
        Programs
      </Typography>
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

function EmptyStateCard() {
  return (
    <div
      id="empty-state-card"
      className="m-4 flex w-[800px] flex-col items-center justify-center gap-6 rounded-md border border-neutral-800 py-8"
    >
      <div className="rounded-md border border-neutral-800 p-4">
        <Logo />
      </div>
      <div className="flex flex-col items-center justify-center gap-2">
        <p className="text-md">Create a program</p>
        <div className="flex max-w-[250px] justify-center text-center">
          <p className="text-sm text-neutral-400">
            Create a new program to get started with{' '}
            <span className="font-semibold underline underline-offset-4">
              ai powered
            </span>{' '}
            programming.
          </p>
        </div>
      </div>
      <div className="flex w-full justify-center pt-2">
        <Button variant="outline" asChild>
          <Link href="/home/programs/new">New program</Link>
        </Button>
      </div>
    </div>
  )
}
