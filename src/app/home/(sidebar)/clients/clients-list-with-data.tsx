"use client"

import { useQuery } from "convex/react"
import { BasicSkeleton } from "@/components/skeletons/basic-skeleton"
import { api } from "@/convex/_generated/api"
import { ClientsList } from "./client-list-item"

export default function ClientsListWithData() {
  const clients = useQuery(api.users.getAllByTrainerId)
  if (clients === undefined) {
    return <BasicSkeleton />
  }
  return <ClientsList clients={clients} />
}
