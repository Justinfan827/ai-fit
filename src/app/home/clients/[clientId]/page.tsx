import { Logo } from '@/components/icons'
import { Tp } from '@/components/typography'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import {
  getAllCurrentUserUnassignedPrograms,
  getClientUserWithPrograms,
} from '@/lib/supabase/server/database.operations.queries'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { AssignProgramSidesheet } from './assign-program-sidesheet'
import Header from '@/components/header'
import { PageContent, PageLayout, PageSection } from '@/components/page-layout'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { EmptyStateCard } from '@/components/empty-state'

export default async function ClientPage({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  const clientId = (await params).clientId
  const { data, error } = await getClientUserWithPrograms(clientId)
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
          <BreadcrumbPage>{`${data.firstName} ${data.lastName}`}</BreadcrumbPage>
        </BreadcrumbItem>
      </Header>
      <div id="home content">
        <PageHeader 
          title={`Client: ${data.firstName} ${data.lastName}`}
          subtitle={data.email}
          actions={
            <AssignProgramSidesheet clientId={clientId} programs={programs} />
          }
        />
        <PageContent>
          <PageSection id="programs-container">
            <Tp className="text-2xl tracking-wide">Programs</Tp>
            {data.programs.length === 0 ? (
              <EmptyStateCard
                title="Assign a program"
                subtitle="Assign a program to this client to help them reach their goals."
                buttonText="Assign Program"
                className="w-full"
              />
            ) : (
              <div className="flex flex-col">
                {data.programs.map((program, idx) => (
                  <Link
                    href={`/home/programs/${program.id}`}
                    key={program.id}
                    className={cn(
                      'flex border-x border-neutral-700 px-4 py-4',
                      idx === 0 && 'rounded-t-sm border-t border-neutral-700',
                      idx === data.programs.length - 1 && 'rounded-b-sm',
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
