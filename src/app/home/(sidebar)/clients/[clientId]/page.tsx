import Link from "next/link"
import { EmptyStateCard } from "@/components/empty-state"
import { Icons } from "@/components/icons"
import { PageLayout } from "@/components/page-layout"
import { SiteHeader } from "@/components/site-header"
import { Tp } from "@/components/typography"
import { Button } from "@/components/ui/button"
import { getAllCurrentUserUnassignedPrograms } from "@/lib/supabase/server/database.operations.queries"
import { getClientHomePageData } from "@/lib/supabase/server/users/trainer-repo"
import { cn } from "@/lib/utils"
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
            <Button asChild>
              <Link href={`/home/programs/generate?clientId=${clientId}`}>
                New program
                <Icons.sparkles className="h-5 w-5" />
              </Link>
            </Button>
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
            details={clientData.details}
          />
        </div>
        <div className="flex flex-col gap-4 pt-8 pb-4 md:gap-6 md:px-4 md:py-6">
          <Tp variant="h4">Assigned Programs</Tp>
          {clientData.programs.length === 0 ? (
            <EmptyStateCard
              actionComponent={
                <AssignProgramButton clientId={clientId} programs={programs} />
              }
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
        </div>
      </div>
    </PageLayout>
  )
}
