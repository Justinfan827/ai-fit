import WorkoutPlanEditor from '@/components/grid/workout-plan-editor'
import { ProgramEditorSidebar } from '@/components/program-editor-sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { getProgramById } from '@/lib/supabase/server/database.operations.queries'

export default async function Page({
  params,
}: {
  params: Promise<{ programid: string }>
}) {
  const programid = (await params).programid
  const { data, error } = await getProgramById(programid)
  if (error) {
    return <div>error: {error.message}</div>
  }
  return (
    <SidebarProvider>
      <ProgramEditorSidebar side="left" />
      <div className="w-full overflow-auto">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/home/programs">Programs</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{data.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        {/* height is calculated as the height of the screen (dvh) - h-16, where 16 = 4rem*/}
        <div className="flex h-[calc(100dvh-4rem)] w-full overflow-auto">
          <WorkoutPlanEditor serverProgram={data} />
        </div>
      </div>
    </SidebarProvider>
  )
}
