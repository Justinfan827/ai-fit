"use client"

import { Suspense } from "react"
import ClientButtonNewClient from "@/components/ClientButtonNewClient"
import { SiteHeader } from "@/components/site-header"
import { BasicSkeleton } from "@/components/skeletons/basic-skeleton"
import ClientsListWithData from "./clients-list-with-data"

export default function ClientsPage() {
  return (
    <>
      <SiteHeader left={"Clients"} right={<ClientButtonNewClient />} />
      <div
        className="@container/main flex flex-1 flex-col"
        id="clients content"
      >
        <div className="flex flex-col gap-4 pt-8 pb-4 md:gap-6 md:px-4 md:py-6">
          <Suspense fallback={<BasicSkeleton />}>
            <ClientsListWithData />
          </Suspense>
        </div>
      </div>
    </>
  )
}
