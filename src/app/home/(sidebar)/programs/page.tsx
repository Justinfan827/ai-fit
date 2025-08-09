import { Suspense } from "react"
import { AppSidebar } from "@/components/nav/sidebar"
import { SiteHeader } from "@/components/site-header"
import { ButtonSkeleton } from "@/components/skeletons/button-skeleton"
import { ListSkeleton } from "@/components/skeletons/list-skeleton"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getCachedUserT } from "@/lib/supabase/server/database.operations.queries"
import NewProgramButtonWithData from "./new-program-button-with-data"
import ProgramsListWithData from "./programs-list-with-data"

export default async function WorkoutsPage() {
  const user = await getCachedUserT()
  return (
    <>
      <SiteHeader
        left={"Programs"}
        right={
          <Suspense fallback={<ButtonSkeleton />}>
            <NewProgramButtonWithData />
          </Suspense>
        }
      />
      <div
        className="@container/main flex flex-1 flex-col"
        id="programs content"
      >
        <div className="flex flex-col gap-4 pt-8 pb-4 md:gap-6 md:px-4 md:py-6">
          <Suspense fallback={<ListSkeleton />}>
            <ProgramsListWithData />
          </Suspense>
        </div>
      </div>
    </>
  )
}
