import dayjs from "dayjs"
import Link from "next/link"
import { Icons } from "@/components/icons"
import { SiteHeader } from "@/components/site-header"
import { Tp } from "@/components/typography"
import { Button } from "@/components/ui/button"
import { getUserPrograms } from "@/lib/supabase/server/database.operations.queries"
import { cn } from "@/lib/utils"

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

type Program = {
  id: string
  name: string
  created_at: string
}

function ProgramsList({ programs }: { programs: Program[] }) {
  if (programs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Tp className="text-muted-foreground" variant="p">
          No programs found. Create your first program to get started.
        </Tp>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {programs.map((program) => (
        <ProgramListItem key={program.id} program={program} />
      ))}
    </div>
  )
}

function ProgramListItem({ program }: { program: Program }) {
  return (
    <Link href={`/home/programs/${program.id}`}>
      <div
        className={cn(
          "group flex items-center gap-2 rounded-md border px-4 py-4",
          "transition-all duration-200 ease-in-out hover:shadow-lg hover:shadow-primary/10"
        )}
      >
        <div className="flex items-center gap-4">
          <div className="flex size-8 items-center justify-center rounded-lg bg-muted transition-all duration-200 ease-in-out">
            <Icons.sparkles className="size-4 text-muted-foreground" />
          </div>
          <div className="flex flex-col">
            <div className="font-medium">{program.name}</div>
            <div className="text-muted-foreground text-xs">
              Created {dayjs(program.created_at).format("MM/DD/YY")}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
