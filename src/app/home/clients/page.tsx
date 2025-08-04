import { ClientsList } from "@/app/home/clients/client-list-item"
import ClientButtonNewClient from "@/components/ClientButtonNewClient"
import { SiteHeader } from "@/components/site-header"
import {
  getCurrentUser,
  getCurrentUserClients,
} from "@/lib/supabase/server/database.operations.queries"

export default async function ClientsPage() {
  // Get current user and clients data
  const [user, clients] = await Promise.all([
    getCurrentUser(),
    getCurrentUserClients(),
  ])

  const { error: userError } = user
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
