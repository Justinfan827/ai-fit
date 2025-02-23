import ProgramEditorContainer from '@/components/grid/ProgramEditorContainer'
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
import { getExercises } from '@/lib/supabase/server/database.operations.queries'

export default async function Page() {
  const [exercises] = await Promise.all([getExercises()])
  if (exercises.error) {
    return <div>error: {exercises.error.message}</div>
  }
  return (
    <SidebarProvider defaultOpen={false}>
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
                <BreadcrumbPage>New</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <ProgramEditorContainer serverExercises={exercises.data} />
      </div>
    </SidebarProvider>
  )
}
