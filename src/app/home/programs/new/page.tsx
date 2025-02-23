import ProgramEditorContainer from '@/components/grid/ProgramEditorContainer'
import { Logo } from '@/components/icons'
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
    <SidebarProvider>
      <div className="w-full overflow-auto">
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
          <div className="flex items-center">
            <Logo />
            <Separator orientation="vertical" className="mx-4 h-6" />
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
                  <BreadcrumbPage>New Program</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <SidebarTrigger className="-ml-1" />
        </header>
        <ProgramEditorContainer serverExercises={exercises.data} />
      </div>
      <ProgramEditorSidebar side="right" />
    </SidebarProvider>
  )
}
