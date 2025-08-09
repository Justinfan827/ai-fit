import { getCurrentUserClients } from "@/lib/supabase/server/database.operations.queries"
import { ClientsList } from "./client-list-item"

export default async function ClientsListWithData() {
  const clients = await getCurrentUserClients()
  if (clients.error) {
    return <div>Error: {clients.error.message}</div>
  }
  return <ClientsList clients={clients.data} />
}
