import { createFileRoute } from "@tanstack/react-router"
// import { SiteHeader } from '@/components/site-header'
// import NewProgramButton from '@/app/home/(sidebar)/programs/new-program-button'
// import ProgramsListWithData from '@/app/home/(sidebar)/programs/programs-list-with-data'

export const Route = createFileRoute("/home/programs")({
  component: ProgramsPage,
  ssr: false,
})

function ProgramsPage() {
  return (
    <>
      {/* <SiteHeader left="Programs" right={<NewProgramButton />} /> */}
      <div
        className="@container/main flex flex-1 flex-col"
        id="programs content"
      >
        <div className="flex flex-col gap-4 pt-8 pb-4 md:gap-6 md:px-4 md:py-6">
          {/* <ProgramsListWithData /> */}
        </div>
      </div>
    </>
  )
}
