import Link from "next/link"
import { EmptyStateCard } from "@/components/empty-state"
import Header from "@/components/header"
import { Icons } from "@/components/icons"
import { PageHeader } from "@/components/page-header"
import { PageContent, PageLayout, PageSection } from "@/components/page-layout"
import { Tp } from "@/components/typography"
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { getAllCurrentUserUnassignedPrograms } from "@/lib/supabase/server/database.operations.queries"
import newTrainerRepo from "@/lib/supabase/server/users/trainer-repo"
import { cn } from "@/lib/utils"
import { AssignProgramSidesheet } from "./assign-program-sidesheet"
import { ClientDetailsPageSection } from "./details"

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
          actions={
            <div className="flex gap-4">
              <AssignProgramSidesheet clientId={clientId} programs={programs} />
              <Button asChild>
                <Link href={`/home/programs/generate?clientId=${clientId}`}>
                  New program
                  <Icons.sparkles className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          }
          subtitle={clientData.email}
          title={`${clientData.firstName} ${clientData.lastName}`}
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
                buttonText="Assign program"
                className="w-full"
                subtitle="Assign a program to this client to help them reach their goals."
                title="Assign a program"
              />
            ) : (
              <div className="flex flex-col">
                {clientData.programs.map((program, idx) => (
                  <Link
                    className={cn(
                      "flex border-neutral-700 border-x px-4 py-4",
                      idx === 0 && "rounded-t-sm border-neutral-700 border-t",
                      idx === clientData.programs.length - 1 && "rounded-b-sm",
                      "border-neutral-700 border-b"
                    )}
                    href={`/home/programs/${program.id}`}
                    key={program.id}
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
