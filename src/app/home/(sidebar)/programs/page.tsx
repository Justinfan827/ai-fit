import { Suspense } from "react"
import { SiteHeader } from "@/components/site-header"
import { BasicSkeleton } from "@/components/skeletons/basic-skeleton"
import { ButtonSkeleton } from "@/components/skeletons/button-skeleton"
import NewProgramButtonWithData from "./new-program-button-with-data"
import ProgramsListWithData from "./programs-list-with-data"

export default function WorkoutsPage() {
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
          <Suspense fallback={<BasicSkeleton />}>
            <ProgramsListWithData />
          </Suspense>
        </div>
      </div>
    </>
  )
}
