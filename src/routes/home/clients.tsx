import { createFileRoute } from "@tanstack/react-router"
// import ClientButtonNewClient from '@/components/ClientButtonNewClient'
// import { SiteHeader } from '@/components/site-header'
// import ClientsListWithData from '@/app/home/(sidebar)/clients/clients-list-with-data'

export const Route = createFileRoute("/home/clients")({
  component: ClientsPage,
  ssr: false,
})

function ClientsPage() {
  return (
    <>
      {/* <SiteHeader left="Clients" right={<ClientButtonNewClient />} /> */}
      <div
        className="@container/main flex flex-1 flex-col"
        id="clients content"
      >
        <div className="flex flex-col gap-4 pt-8 pb-4 md:gap-6 md:px-4 md:py-6">
          {/* <ClientsListWithData /> */}
        </div>
      </div>
    </>
  )
}
