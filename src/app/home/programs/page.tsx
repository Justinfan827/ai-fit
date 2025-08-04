import dayjs from "dayjs"
import Link from "next/link"
import { Icons } from "@/components/icons"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { getUserPrograms } from "@/lib/supabase/server/database.operations.queries"
import { ProgramsList } from "./program-list"

const NewProgramButton = () => (
  <Button asChild>
    <Link href={"/home/programs/generate"}>
      New program
      <Icons.sparkles className="h-5 w-5" />
    </Link>
  </Button>
)

export default async function WorkoutsPage() {
  const { data, error } = await getUserPrograms()
  if (error) {
    return <div>error: {error.message}</div>
  }

  return (
    <>
      <SiteHeader left={"Programs"} right={<NewProgramButton />} />
      <div
        className="@container/main flex flex-1 flex-col"
        id="programs content"
      >
        <div className="flex flex-col gap-4 pt-8 pb-4 md:gap-6 md:px-4 md:py-6">
          <ProgramsList programs={data} />
        </div>
      </div>
    </>
  )
}
