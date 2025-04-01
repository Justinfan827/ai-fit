import ProgramEditorContainer from '@/components/grid/ProgramEditorContainer'
import Header from '@/components/header'
import { PageLayout } from '@/components/page-layout'
import { ProgramEditorSidebar } from '@/components/program-editor-sidebar'
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { SidebarProvider } from '@/components/ui/sidebar'
import { getExercises } from '@/lib/supabase/server/database.operations.queries'

export default async function Page() {
  const [exercises] = await Promise.all([getExercises()])
  if (exercises.error) {
    return <div>error: {exercises.error.message}</div>
  }
  return (
    <PageLayout>
      <Header>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink href="/home">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden md:block" />
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink href="/home/programs">Programs</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden md:block" />
        <BreadcrumbItem>
          <BreadcrumbPage>New Program</BreadcrumbPage>
        </BreadcrumbItem>
      </Header>
      <SidebarProvider>
        <div className="w-full overflow-auto">
          <ProgramEditorContainer serverExercises={exercises.data} />
        </div>
        <ProgramEditorSidebar side="right" />
      </SidebarProvider>
    </PageLayout>
  )
}
