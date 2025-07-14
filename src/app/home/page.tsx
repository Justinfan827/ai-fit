import Link from "next/link"
import ClientButtonNewClient from "@/components/ClientButtonNewClient"
import { EmptyStateCard } from "@/components/empty-state"
import Header from "@/components/header"
import { PageHeader } from "@/components/page-header"
import { PageContent, PageLayout, PageSection } from "@/components/page-layout"
import { Tp } from "@/components/typography"
import { BreadcrumbItem, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { PAGES } from "@/lib/constants"
import {
  getAllPrograms,
  getCurrentUser,
  getCurrentUserClients,
} from "@/lib/supabase/server/database.operations.queries"
import { cn } from "@/lib/utils"

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
        <Link href={PAGES.generateProgram.url}>New program</Link>
      </Button>
    </>
  )

  return (
    <PageLayout>
      <div className="w-full" id="home content">
        <Header>
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbPage>Home</BreadcrumbPage>
          </BreadcrumbItem>
        </Header>
        <PageHeader
          actions={headerActions}
          subtitle={userData.sbUser.email}
          title={`Welcome ${userData.metadata.firstName} ${userData.metadata.lastName}`}
        />
        <PageContent>
          <PageSection>
            <Tp className="text-2xl tracking-wide">Programs</Tp>
            {programData.length === 0 ? (
              <EmptyStateCard
                buttonHref={PAGES.generateProgram.url}
                buttonText="New program"
                className="w-full"
                subtitle="Create a new program to get started with ai powered programming."
                title="Create a program"
              />
            ) : (
              <div className="">
                {programData.map((program, idx) => (
                  <Link
                    className={cn(
                      "flex border-neutral-700 border-x px-4 py-4",
                      idx === 0 && "rounded-t-sm border-neutral-700 border-t",
                      idx === programData.length - 1 && "rounded-b-sm",
                      "border-neutral-700 border-b"
                    )}
                    href={PAGES.programId.url(program.id)}
                    key={program.id}
                  >
                    {program.name}
                  </Link>
                ))}
              </div>
            )}
          </PageSection>
          <PageSection>
            <Tp className="text-2xl tracking-wide">Clients</Tp>

            {clientsData.length === 0 ? (
              <EmptyStateCard
                // TODO: update this.
                buttonHref={PAGES.generateProgram.url}
                buttonText="New Client"
                className="w-full"
                subtitle="Add a new client to get started with ai powered programming."
                title="Add a client"
              />
            ) : (
              <div className="flex flex-col">
                {clientsData.map((client, idx) => (
                  <Link
                    className={cn(
                      "flex border-neutral-700 border-x px-4 py-4",
                      idx === 0 && "rounded-t-sm border-neutral-700 border-t",
                      idx === clientsData.length - 1 && "rounded-b-sm",
                      "border-neutral-700 border-b"
                    )}
                    href={PAGES.clientId.url(client.id)}
                    key={client.id}
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
