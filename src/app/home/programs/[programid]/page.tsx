import { Logo } from "@/components/icons"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import {
  getExercises,
  getProgramById,
} from "@/lib/supabase/server/database.operations.queries"

export default async function Page({
  params,
}: {
  params: Promise<{ programid: string }>
}) {
  const programid = (await params).programid
  const [program, exercises] = await Promise.all([
    getProgramById(programid),
    getExercises(),
  ])
  if (program.error) {
    return <div>error: {program.error.message}</div>
  }
  if (exercises.error) {
    return <div>error: {exercises.error.message}</div>
  }
  return (
    <SidebarProvider>
      <div className="w-full overflow-auto">
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
          <div className="flex items-center">
            <Logo />
            <Separator className="mx-4 h-6" orientation="vertical" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/home">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/home/programs">
                    Programs
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{program.data.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <SidebarTrigger className="-ml-1" />
        </header>
        {/* <ProgramEditorContainer
          serverProgram={program.data}
          serverExercises={exercises.data}
        /> */}
      </div>
      {/* <ProgramEditorSidebar side="right" /> */}
    </SidebarProvider>
  )
}
