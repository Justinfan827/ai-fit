import ClientButtonNewClient from '@/components/ClientButtonNewClient'
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
  const { data: programData, error } = programs
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
      <div id="home content">
        <div className="border-b border-b-neutral-800 p-4">
          <div className="mx-auto flex max-w-7xl items-center justify-between py-6 sm:px-6 lg:px-8 lg:py-6">
            <div>
              <Tp className="text-2xl tracking-wide" variant="h2">
                Welcome{' '}
                {`${userData.metadata.firstName} ${userData.metadata.lastName}`}
              </Tp>
              <p className="leading-none text-neutral-500">
                {userData.sbUser.email}
              </p>
            </div>
            <div className="space-x-4">
              <ClientButtonNewClient />
              <Button asChild>
                <Link href="/home/programs/new">New program</Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div id="programs-container" className="space-y-4 p-4">
            <Tp className="text-2xl tracking-wide">Programs</Tp>
            {programData.length === 0 ? (
              <div className="mx-auto flex w-full justify-center">
                <EmptyStateCard
                  title="Create a program"
                  subtitle="Create a new program to get started with ai powered programming."
                  buttonText="New program"
                  buttonHref="/home/programs/new"
                />
              </div>
            ) : (
              <div className="">
                {programData.map((program, idx) => (
                  <Link
                    href={`/home/programs/${program.id}`}
                    key={program.id}
                    className={cn(
                      'flex border-x border-b border-neutral-700 px-4 py-4',
                      idx === 0 && 'rounded-t-sm border-t',
                      idx === programData.length - 1 && 'rounded-b-sm border-b'
                    )}
                  >
                    {program.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div id="clients-container" className="space-y-4 p-4">
            <Tp className="text-2xl tracking-wide">Clients</Tp>

            {clientsData.length === 0 ? (
              <div className="mx-auto flex w-full justify-center">
                <EmptyStateCard
                  title="Add a client"
                  subtitle="Add a new client to get started with ai powered programming."
                  buttonText="New Client"
                  buttonHref="/home/programs/new"
                />
              </div>
            ) : (
              <>
                {clientsData.map((client, idx) => (
                  <Link
                    href={`/home/clients/${client.id}`}
                    key={client.id}
                    className={cn(
                      'flex border-x border-b border-neutral-700 px-4 py-4',
                      idx === 0 && 'rounded-t-sm border-t',
                      idx === programData.length - 1 && 'rounded-b-sm border-b'
                    )}
                  >
                    {client.firstName} {client.lastName}
                  </Link>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyStateCard({
  title,
  subtitle,
  buttonText,
  buttonHref,
}: {
  title: string
  subtitle: string
  buttonText: string
  buttonHref: string
}) {
  return (
    <div
      id="empty-state-card"
      className="m-4 flex w-[800px] flex-col items-center justify-center gap-6 rounded-md border border-neutral-800 py-8"
    >
      <div className="rounded-md border border-neutral-800 p-4">
        <Logo />
      </div>
      <div className="flex flex-col items-center justify-center gap-2">
        <p className="text-md">{title}</p>
        <div className="flex max-w-[250px] justify-center text-center">
          <p className="text-sm text-neutral-400">{subtitle}</p>
        </div>
      </div>
      {/* <div className="flex w-full justify-center pt-2"> */}
      {/*   <Button variant="outline" asChild> */}
      {/*     <Link href={buttonHref}>{buttonText}</Link> */}
      {/*   </Button> */}
      {/* </div> */}
    </div>
  )
}
