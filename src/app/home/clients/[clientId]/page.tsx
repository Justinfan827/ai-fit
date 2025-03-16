import { EmptyStateCard } from '@/components/empty-state'
import Header from '@/components/header'
import { PageHeader } from '@/components/page-header'
import { PageContent, PageLayout, PageSection } from '@/components/page-layout'
import { Tp } from '@/components/typography'
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { getAllCurrentUserUnassignedPrograms } from '@/lib/supabase/server/database.operations.queries'
import newTrainerRepo from '@/lib/supabase/server/users/trainer-repo'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { AssignProgramSidesheet } from './assign-program-sidesheet'
import { ClientDetailsPageSection } from './details'
import GenerateProgramModal from './GenerateProgramModal'

export default async function ClientPage({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  const clientId = (await params).clientId
  const { data: clientData, error } =
    await newTrainerRepo().getClientHomePageData(clientId)
  if (error) {
    return <div>error: {error.message}</div>
  }

  const { data: programs, error: programsError } =
    await getAllCurrentUserUnassignedPrograms()
  if (programsError) {
    return <div>error: {programsError.message}</div>
  }
  return (
    <PageLayout>
      <Header>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink href="/home">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden md:block" />
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink href="/home/clients">Clients</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden md:block" />
        <BreadcrumbItem>
          <BreadcrumbPage>{`${clientData.firstName} ${clientData.lastName}`}</BreadcrumbPage>
        </BreadcrumbItem>
      </Header>
      <div id="home content">
        <PageHeader
          title={`${clientData.firstName} ${clientData.lastName}`}
          subtitle={clientData.email}
          actions={
            <div className="flex gap-4">
              <AssignProgramSidesheet clientId={clientId} programs={programs} />
              <GenerateProgramModal client={clientData} />
            </div>
          }
        />
        <PageContent>
          <ClientDetailsPageSection
            clientUserId={clientId}
            details={clientData.details}
          />
          <PageSection>
            <Tp variant="h4">Assigned Programs</Tp>
            {clientData.programs.length === 0 ? (
              <EmptyStateCard
                title="Assign a program"
                subtitle="Assign a program to this client to help them reach their goals."
                buttonText="Assign Program"
                className="w-full"
              />
            ) : (
              <div className="flex flex-col">
                {clientData.programs.map((program, idx) => (
                  <Link
                    href={`/home/programs/${program.id}`}
                    key={program.id}
                    className={cn(
                      'flex border-x border-neutral-700 px-4 py-4',
                      idx === 0 && 'rounded-t-sm border-t border-neutral-700',
                      idx === clientData.programs.length - 1 && 'rounded-b-sm',
                      'border-b border-neutral-700'
                    )}
                  >
                    {program.name}
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
