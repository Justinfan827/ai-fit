import Link from "next/link"
import { Icons } from "@/components/icons"
import { PageLayout } from "@/components/page-layout"
import { ProgramGrid } from "@/components/program-grid"
import { SiteHeader } from "@/components/site-header"
import { Tp } from "@/components/typography"
import { getAllCurrentUserUnassignedPrograms } from "@/lib/supabase/server/database.operations.queries"
import { getClientHomePageData } from "@/lib/supabase/server/users/trainer-repo"
import NewProgramButtonWithData from "../../programs/new-program-button-with-data"
import AssignProgramButton from "./assign-program-button"
import { ClientDetailsPageSection } from "./details"

export default async function ClientPage({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  const clientId = (await params).clientId
  const { data: clientData, error } = await getClientHomePageData(clientId)
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
      <SiteHeader
        left={
          <div className="flex items-center gap-2 leading-none">
            <Link
              className="text-muted-foreground hover:text-primary"
              href="/home/clients"
            >
              Clients
            </Link>
            <Icons.chevronRight className="size-3 text-muted-foreground" />
            <p className="capitalize">
              {clientData.firstName} {clientData.lastName}
            </p>
          </div>
        }
        right={
          <div className="flex gap-4">
            <NewProgramButtonWithData />
          </div>
        }
      />
      <div
        className="@container/main flex flex-1 flex-col"
        id="clients content"
      >
        <div className="flex flex-col gap-4 pt-8 pb-4 md:gap-6 md:px-4 md:py-6">
          <ClientDetailsPageSection
            clientUserId={clientId}
            trainerNotes={clientData.trainerNotes}
          />
        </div>
        <div className="flex flex-col gap-4 pt-8 pb-4 md:gap-6 md:px-4 md:py-6">
          <Tp variant="h4">Assigned Programs</Tp>
          <ProgramGrid
            emptyState={{
              title: "Assign a program",
              subtitle:
                "Assign a program to this client to help them reach their goals.",
              actionComponent: (
                <AssignProgramButton clientId={clientId} programs={programs} />
              ),
            }}
            linkPath="/home/studio/:programId"
            programs={clientData.programs}
            showActions={false}
            showTimestamp={false}
            variant="full"
          />
        </div>
      </div>
    </PageLayout>
  )
}
