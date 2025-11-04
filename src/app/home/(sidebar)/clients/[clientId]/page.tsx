"use client"

import { useQuery } from "convex/react"
import Link from "next/link"
import { notFound, useParams } from "next/navigation"
import { Icons } from "@/components/icons"
import { SiteHeader } from "@/components/site-header"
import { BasicSkeleton } from "@/components/skeletons/basic-skeleton"
import { Tp } from "@/components/typography"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/convex/_generated/api"
import NewProgramButton from "../../programs/new-program-button"
import ProgramsListWithData from "../../programs/programs-list-with-data"
import AssignProgramButton from "./assign-program-button"
import ClientBasicInfoSection from "./basic-information-section"
import { ClientTrainerNotesPageSection } from "./trainer-notes"

// Component for client name in header
const ClientName = ({
  firstName,
  lastName,
}: {
  firstName: string
  lastName: string
}) => {
  return (
    <p className="capitalize">
      {firstName} {lastName}
    </p>
  )
}

const ClientBasicInfo = ({
  age,
  gender,
  weight,
  height,
}: {
  age: number
  gender: string
  weight: { value: number; unit: "kg" | "lbs" }
  height: { value: number; unit: "cm" | "in" }
}) => {
  return (
    <ClientBasicInfoSection
      age={age}
      gender={gender}
      height={height}
      weight={weight}
    />
  )
}

// Component for client details section
const ClientDetails = ({
  clientId,
  trainerNotes,
  age,
  gender,
  weight,
  height,
}: {
  clientId: string
  trainerNotes: Array<{ id: string; title: string; description: string }>
  age: number
  gender: string
  weight: { value: number; unit: "kg" | "lbs" }
  height: { value: number; unit: "cm" | "in" }
}) => {
  return (
    <ClientTrainerNotesPageSection
      age={age}
      clientUserId={clientId}
      gender={gender}
      height={height}
      trainerNotes={trainerNotes}
      weight={weight}
    />
  )
}

const ClientPageHeader = ({ clientId }: { clientId: string }) => {
  const client = useQuery(api.users.getClientById, { clientId })
  if (client === null) {
    return notFound()
  }

  return (
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
          {client ? (
            <ClientName
              firstName={client.firstName}
              lastName={client.lastName}
            />
          ) : (
            <Skeleton className="h-5 w-32" />
          )}
        </div>
      }
      right={
        <div className="flex gap-4">
          <NewProgramButton />
        </div>
      }
    />
  )
}

const ClientPageBody = ({ clientId }: { clientId: string }) => {
  const client = useQuery(api.users.getClientById, { clientId })
  if (client === null) {
    // client does not exist
    return notFound()
  }
  if (client === undefined) {
    // loading
    return (
      <div
        className="@container/main flex flex-1 flex-col"
        id="clients content"
      >
        <div className="flex flex-col gap-4 pt-8 pb-4 md:gap-6 md:px-4 md:py-6">
          <BasicSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="@container/main flex flex-1 flex-col" id="clients content">
      <div className="flex flex-col gap-4 pt-8 pb-4 md:gap-6 md:px-4 md:py-6">
        <ClientBasicInfo
          age={client.age}
          gender={client.gender}
          height={client.height}
          weight={client.weight}
        />
        <ClientDetails
          age={client.age}
          clientId={clientId}
          gender={client.gender}
          height={client.height}
          trainerNotes={client.trainerNotes}
          weight={client.weight}
        />
        <Tp variant="h4">Assigned Programs</Tp>
        <ProgramsListWithData
          clientId={clientId}
          emptyState={{
            title: "Assign a program",
            subtitle:
              "Assign a program to this client to help them reach their goals.",
            actionComponent: <AssignProgramButton clientId={clientId} />,
          }}
        />
      </div>
    </div>
  )
}

export default function ClientPage() {
  const params = useParams()
  const clientId = params.clientId as string
  return (
    <>
      <ClientPageHeader clientId={clientId} />
      <ClientPageBody clientId={clientId} />
    </>
  )
}
