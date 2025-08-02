import Link from "next/link"
import ClientButtonNewClient from "@/components/ClientButtonNewClient"
import { EmptyStateCard } from "@/components/empty-state"
import { SiteHeader } from "@/components/site-header"
import type { Client } from "@/lib/domain/clients"
import {
  getCurrentUser,
  getCurrentUserClients,
} from "@/lib/supabase/server/database.operations.queries"
import { cn } from "@/lib/utils"
import ClientListItem from "./client-list-item"

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

  return (
    <>
      <SiteHeader left={"Clients"} right={<ClientButtonNewClient />} />
      <div
        className="@container/main flex flex-1 flex-col"
        id="clients content"
      >
        <div className="flex flex-col gap-4 pt-8 pb-4 md:gap-6 md:px-4 md:py-6">
          <ClientsList clients={clientsData} />
        </div>
      </div>
    </>
  )
}

function ClientsList({ clients }: { clients: Client[] }) {
  if (clients.length === 0) {
    return (
      <EmptyStateCard
        buttonHref="/home/clients/new"
        buttonText="New Client"
        className="w-full"
        subtitle="Add a new client to get started with ai powered programming."
        title="Add a client"
      />
    )
  }
  return (
    <div className="flex flex-col gap-4">
      {clients.map((client) => (
        <ClientListItem client={client} key={client.id} />
      ))}
    </div>
  )
}
