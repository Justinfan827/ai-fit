import ClientButtonNewClient from '@/components/ClientButtonNewClient'
import { EmptyStateCard } from '@/components/empty-state'
import Header from '@/components/header'
import { PageHeader } from '@/components/page-header'
import { PageContent, PageLayout, PageSection } from '@/components/page-layout'
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  getCurrentUser,
  getCurrentUserClients,
} from '@/lib/supabase/server/database.operations.queries'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export default async function ClientsPage() {
  // Get current user and clients data
  const [user, clients] = await Promise.all([
    getCurrentUser(),
    getCurrentUserClients(),
  ])

  const { data: userData, error: userError } = user
  if (userError) {
    return <div>error: {userError.message}</div>
  }

  const { data: clientsData, error: clientsError } = clients
  if (clientsError) {
    return <div>error: {clientsError.message}</div>
  }

  const headerActions = <ClientButtonNewClient />

  return (
    <PageLayout>
      <Header>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink href="/home">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden md:block" />
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbPage>Clients</BreadcrumbPage>
        </BreadcrumbItem>
      </Header>
      <div id="clients content">
        <PageHeader
          title="My Clients"
          subtitle="Manage your clients and their programs"
          actions={headerActions}
        />
        <PageContent>
          <PageSection id="clients-container">
            {clientsData.length === 0 ? (
              <EmptyStateCard
                title="Add a client"
                subtitle="Add a new client to get started with ai powered programming."
                buttonText="New Client"
                buttonHref="/home/clients/new"
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

