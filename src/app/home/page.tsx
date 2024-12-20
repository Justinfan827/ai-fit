import { Logo } from '@/components/icons'
import { Typography } from '@/components/typography'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  getAllPrograms,
  getCurrentUser,
} from '@/lib/supabase/server/database.operations.queries'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export default async function WorkoutsPage() {
  const [programs, user] = await Promise.all([
    getAllPrograms(),
    getCurrentUser(),
  ])

  const { data: userData, error: userError } = user
  if (userError) {
    return <div>error: {userError.message}</div>
  }
  const { data, error } = programs
  if (error) {
    return <div>error: {error.message}</div>
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b px-4">
          <Logo />
          <Separator orientation="vertical" className="h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbPage>Home</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        {/* height is calculated as the height of the screen (dvh) - h-16, where 16 = 4rem*/}
        <div className="mx-auto flex h-[calc(100dvh-4rem)] w-full justify-center">
          <div className="h-[4rem]">
            <EmptyStateCard />
          </div>
        </div>
      </div>
    )
  }
  return (
    <div>
      <header className="flex h-16 shrink-0 items-center gap-4 border-b px-4">
        <Logo />
        <Separator orientation="vertical" className="h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbPage>Home</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <div id="home content">
        <div className="border-b border-b-neutral-800 p-4">
          <div className="mx-auto flex max-w-7xl items-center justify-between sm:px-6 sm:py-6 lg:px-8 lg:py-6">
            <div>
              <Typography className="text-2xl tracking-wide" variant="h2">
                Welcome{' '}
                {`${userData.metadata.firstName} ${userData.metadata.lastName}`}
              </Typography>
              <p className="leading-none text-neutral-500">
                {userData.sbUser.email}
              </p>
            </div>
            <Button asChild>
              <Link href="/home/programs/new">New program</Link>
            </Button>
          </div>
        </div>
        <div className="p-4">
        <Typography></Typography>
          <div id="list-container" className="mt-8">
            {data.map((program, idx) => (
              <Link
                href={`/home/programs/${program.id}`}
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
