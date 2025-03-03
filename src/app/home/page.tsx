import ClientButtonNewClient from '@/components/ClientButtonNewClient'
import Header from '@/components/header'
import { Tp } from '@/components/typography'
import { BreadcrumbItem, BreadcrumbPage } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { EmptyStateCard } from '@/components/empty-state'
import { PageContent, PageLayout, PageSection } from '@/components/page-layout'
import { PageHeader } from '@/components/page-header'
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

  const headerActions = (
    <>
      <ClientButtonNewClient />
      <Button asChild>
        <Link href="/home/programs/new">New program</Link>
      </Button>
    </>
  )

  return (
    <PageLayout>
      <Header>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbPage>Home</BreadcrumbPage>
        </BreadcrumbItem>
      </Header>
      <div id="home content">
        <PageHeader 
          title={`Welcome ${userData.metadata.firstName} ${userData.metadata.lastName}`}
          subtitle={userData.sbUser.email}
          actions={headerActions}
        />
        <PageContent>
          <PageSection id="programs-container">
            <Tp className="text-2xl tracking-wide">Programs</Tp>
            {programData.length === 0 ? (
              <EmptyStateCard
                title="Create a program"
                subtitle="Create a new program to get started with ai powered programming."
                buttonText="New program"
                buttonHref="/home/programs/new"
                className="w-full"
              />
            ) : (
              <div className="">
                {programData.map((program, idx) => (
                  <Link
                    href={`/home/programs/${program.id}`}
                    key={program.id}
                    className={cn(
                      'flex border-x border-neutral-700 px-4 py-4',
                      idx === 0 && 'rounded-t-sm border-t border-neutral-700',
                      idx === programData.length - 1 && 'rounded-b-sm',
                      'border-b border-neutral-700'
                    )}
                  >
                    {program.name}
                  </Link>
                ))}
              </div>
            )}
          </PageSection>
          <PageSection id="clients-container">
            <Tp className="text-2xl tracking-wide">Clients</Tp>

            {clientsData.length === 0 ? (
              <EmptyStateCard
                title="Add a client"
                subtitle="Add a new client to get started with ai powered programming."
                buttonText="New Client"
                buttonHref="/home/programs/new"
                className="w-full"
              />
            ) : (
              <div className="flex flex-col">
                {clientsData.map((client, idx) => (
                  <Link
                    href={`/home/clients/${client.id}`}
                    key={client.id}
                    className={cn(
                      'flex border-x border-neutral-700 px-4 py-4',
                      idx === 0 && 'rounded-t-sm border-t border-neutral-700',
                      idx === clientsData.length - 1 && 'rounded-b-sm',
                      'border-b border-neutral-700'
                    )}
                  >
                    {client.firstName} {client.lastName}
                  </Link>
                ))}
              </div>
            )}
          </PageSection>
        </PageContent>
      </div>
    </PageLayout>
  )
}
