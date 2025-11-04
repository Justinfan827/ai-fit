"use client"
import { SiteHeader } from "@/components/site-header"
import ProgramsListWithData from "./programs-list-with-data"

export default function WorkoutsPage() {
  return (
    <>
      <SiteHeader
        left={"Programs"}
        right={<div>{/* <NewProgramButtonWithData /> */}</div>}
      />
      <div
        className="@container/main flex flex-1 flex-col"
        id="programs content"
      >
        <div className="flex flex-col gap-4 pt-8 pb-4 md:gap-6 md:px-4 md:py-6">
          <ProgramsListWithData />
        </div>
      </div>
    </>
  )
}
