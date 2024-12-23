import Header from '@/components/header'
import { Logo } from '@/components/icons'
import { Tp } from '@/components/typography'
import { BreadcrumbItem, BreadcrumbPage } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import {
  getAllPrograms,
  getCurrentUser,
  getCurrentUserClients,
} from '@/lib/supabase/server/database.operations.queries'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export default async function WorkoutsPage() {
  const [programs, user, clients] = await Promise.all([
    getAllPrograms(),
    getCurrentUser(),
    getCurrentUserClients(),
  ])

  const { data: userData, error: userError } = user
  if (userError) {
    return <div>error: {userError.message}</div>
  }
  const { data, error } = programs
  if (error) {
    return <div>error: {error.message}</div>
  }

  const { data: clientsData, error: clientsError } = clients
  if (clientsError) {
    return <div>error: {clientsError.message}</div>
  }

  return (
    <div className="w-full">
      <Header>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbPage>Home</BreadcrumbPage>
        </BreadcrumbItem>
      </Header>
      {/* height is calculated as the height of the screen (dvh) - h-16, where 16 = 4rem*/}
      {!data || data.length === 0 ? (
        <div className="mx-auto flex h-[calc(100dvh-4rem)] w-full justify-center">
          <div className="h-[4rem]">
            <EmptyStateCard />
          </div>
        </div>
      ) : (
        <div id="home content">
          <div className="border-b border-b-neutral-800 p-4">
            <div className="mx-auto flex max-w-7xl items-center justify-between sm:px-6 sm:py-6 lg:px-8 lg:py-6">
              <div>
                <Tp className="text-2xl tracking-wide" variant="h2">
                  Welcome{' '}
                  {`${userData.metadata.firstName} ${userData.metadata.lastName}`}
                </Tp>
                <p className="leading-none text-neutral-500">
                  {userData.sbUser.email}
                </p>
              </div>
              <Button asChild>
                <Link href="/home/programs/new">New program</Link>
              </Button>
            </div>
          </div>
          <div id="programs-container" className="space-y-4 p-4">
            <Tp className="text-2xl tracking-wide">Programs</Tp>
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
          <div id="clients-container" className="space-y-4 p-4">
            <Tp className="text-2xl tracking-wide">Clients</Tp>
            {clientsData.map((client, idx) => (
              <Link
                href={`/home/clients/${client.id}`}
                key={client.id}
                className={cn(
                  'flex border-x border-b border-neutral-700 px-4 py-4',
                  idx === 0 && 'rounded-t-sm border-t',
                  idx === data.length - 1 && 'rounded-b-sm border-b'
                )}
              >
                {client.firstName} {client.lastName}
              </Link>
            ))}
          </div>
        </div>
      )}
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

