import Link from "next/link"
import { Suspense } from "react"
import { Icons } from "@/components/icons"
import { PageLayout } from "@/components/page-layout"
import { ProgramGrid } from "@/components/program-grid"
import { SiteHeader } from "@/components/site-header"
import { BasicSkeleton } from "@/components/skeletons/basic-skeleton"
import { ButtonSkeleton } from "@/components/skeletons/button-skeleton"
import { Tp } from "@/components/typography"
import { getCachedAllCurrentUserUnassignedProgramsT } from "@/lib/supabase/server/database.operations.queries"
import { getCachedClientHomePageDataT } from "@/lib/supabase/server/users/trainer-repo"
import NewProgramButtonWithData from "../../programs/new-program-button-with-data"
import AssignProgramButton from "./assign-program-button"
import { ClientDetailsPageSection } from "./details"

// Component for async client name in header
const ClientName = async ({ clientId }: { clientId: string }) => {
  const { firstName, lastName } = await getCachedClientHomePageDataT(clientId)
  return (
    <p className="capitalize">
      {firstName} {lastName}
    </p>
  )
}

// Component for async client details section
const ClientDetails = async ({ clientId }: { clientId: string }) => {
  const { trainerNotes } = await getCachedClientHomePageDataT(clientId)
  return (
    <ClientDetailsPageSection
      clientUserId={clientId}
      trainerNotes={trainerNotes}
    />
  )
}

const ProgramsSection = async ({ clientId }: { clientId: string }) => {
  const [client, programs] = await Promise.all([
    getCachedClientHomePageDataT(clientId),
    getCachedAllCurrentUserUnassignedProgramsT(),
  ])

  return (
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
      programs={client.programs}
      showActions={false}
      showTimestamp={false}
      variant="full"
    />
  )
}

export default async function ClientPage({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  const clientId = (await params).clientId

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
            <Suspense fallback={<ButtonSkeleton className="h-6" />}>
              <ClientName clientId={clientId} />
            </Suspense>
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
        <Suspense fallback={<BasicSkeleton />}>
          <div className="flex flex-col gap-4 pt-8 pb-4 md:gap-6 md:px-4 md:py-6">
            <div>Hello</div>
            <ClientDetails clientId={clientId} />
          </div>
          <div className="flex flex-col gap-4 pt-8 pb-4 md:gap-6 md:px-4 md:py-6">
            <Tp variant="h4">Assigned Programs</Tp>
            <ProgramsSection clientId={clientId} />
          </div>
        </Suspense>
      </div>
    </PageLayout>
  )
}
