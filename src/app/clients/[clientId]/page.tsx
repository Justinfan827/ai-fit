import { ClientProgramWorkoutList } from '@/components/client-program-workout-list'
import {
  EmptyStateCard,
  EmptyStateContent,
  EmptyStateLogo,
  EmptyStateText,
} from '@/components/empty-state'
import Header from '@/components/header'
import { Tp } from '@/components/typography'
import { BreadcrumbItem, BreadcrumbPage } from '@/components/ui/breadcrumb'
import NumberTicker from '@/components/ui/number-ticker'
import { Ping } from '@/components/ui/ping'
import { Separator } from '@/components/ui/separator'
import { Program } from '@/lib/domain/workouts'
import {
  getClientActiveProgram,
  getCurrentUser,
  getClientById,
} from '@/lib/supabase/server/database.operations.queries'
import SupabaseProvider from '@/lib/supabase/use-supabase'
import { Suspense } from 'react'
import { PageContent, PageLayout, PageSection } from '@/components/page-layout'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

/*
 * Here I am logged in as the client
 */
export default async function ClientPage({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  const clientId = (await params).clientId
  const { data: client, error } = await getClientById(clientId)
  
  if (error) {
    return <div>error: {error.message}</div>
  }

  const headerActions = (
    <Button asChild variant="outline">
      <Link href="/home/clients">Back to Clients</Link>
    </Button>
  )

  return (
    <PageLayout>
      <Header>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbPage>Client</BreadcrumbPage>
        </BreadcrumbItem>
      </Header>
      <div id="client content">
        <PageHeader 
          title={`${client.firstName} ${client.lastName}`}
          subtitle={client.email}
          actions={headerActions}
        />
        <PageContent>
          <PageSection>
            <Tp className="text-2xl tracking-wide">Client Details</Tp>
            {/* Client details content */}
          </PageSection>
          <PageSection>
            <Tp className="text-2xl tracking-wide">Assigned Programs</Tp>
            {/* Programs content */}
          </PageSection>
        </PageContent>
      </div>
    </PageLayout>
  )
}

function LoadingSpinner() {
  return <div>Loading...</div>
}

async function ClientAsync() {
  const { data: user, error: userErr } = await getCurrentUser()
  if (userErr) {
    return <div>error: {userErr.message}</div>
  }
  const { data, error } = await getClientActiveProgram()
  if (error) {
    return <div>error: {error.message}</div>
  }
  return (
    <SupabaseProvider>
      <Header>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbPage>Home</BreadcrumbPage>
        </BreadcrumbItem>
      </Header>
      <div id="home content">
        <PageHeader
          title={`Welcome, ${user.metadata.firstName}`}
          subtitle={user.sbUser.email}
        />
        <PageContent>
          <PageSection>
            <ActiveProgram clientId={user.sbUser.id} data={data} />
          </PageSection>
        </PageContent>
      </div>
    </SupabaseProvider>
  )
}

function ActiveProgram({
  clientId,
  data,
}: {
  data: Program | undefined | null
  clientId: string
}) {
  if (!data) {
    return (
      <EmptyStateCard
        title="No Programs"
        subtitle="Create a new program to get started with ai powered programming."
        buttonText="New Program"
        buttonHref="/home/programs/new"
      />
    )
  }
  return (
    <div>
      <div>
        <Tp className="text-xl tracking-wide" variant="h2">
          Current program
        </Tp>
        <p className="text-sm leading-none text-neutral-600">{data.name}</p>
      </div>
      <div id="stats">
        <Separator className="" />
        <div
          id="counts"
          className="flex items-center justify-evenly gap-4 p-2 py-4"
        >
          <div className="" id="completed-count">
            <p className="text-sm leading-none text-neutral-600">
              Workouts completed
            </p>
            <div className="flex items-center gap-4">
              <Ping className="" variant="green" />
              <NumberTicker className="text-xl" value={1} />
            </div>
          </div>
          <Separator orientation="vertical" className="h-12" />
          <div id="weeks-completed-count">
            <p className="text-sm leading-none text-neutral-600">
              Weeks completed
            </p>
            <div className="flex items-center gap-4">
              <Ping className="" variant="green" />
              <NumberTicker className="text-xl" value={1} />
            </div>
          </div>
        </div>
        <Separator className="" />
      </div>
      <ClientProgramWorkoutList programId={data.id} clientId={clientId} />
    </div>
  )
}
